import { callClaude } from '../lib/llm';
import { simplifyDOMElements } from '../lib/ipc';
import {
  Companion,
  AgentResult,
  AgentStatus,
  AgentStep,
  AgentResponse,
  BrowserAction,
  Message,
} from '../types';

const MAX_STEPS = 20;
const STEP_DELAY = 500; // ms between steps

export class AgentEngine {
  private history: Message[] = [];
  private steps: AgentStep[] = [];

  async run(
    goal: string,
    companion: Companion,
    onStatusUpdate: (status: AgentStatus) => void,
    requestApproval: (action: BrowserAction, description: string) => Promise<boolean>
  ): Promise<AgentResult> {
    this.history = [];
    this.steps = [];

    let stepCount = 0;

    try {
      while (stepCount < MAX_STEPS) {
        stepCount++;

        // Update status
        onStatusUpdate({
          isRunning: true,
          currentStep: stepCount,
          totalSteps: MAX_STEPS,
          thought: 'Analyzing page...',
        });

        // 1. Capture current page state
        const [screenshotResult, domResult] = await Promise.all([
          window.electronAPI.captureScreen(),
          window.electronAPI.extractDOM(),
        ]);

        if (!screenshotResult.success || !screenshotResult.data) {
          throw new Error('Failed to capture screenshot');
        }

        const screenshot = screenshotResult.data;
        const dom = domResult.success && domResult.data ? domResult.data : [];
        const domString = simplifyDOMElements(dom);

        // 2. Build message for Claude
        const userMessage = this.buildUserMessage(goal, screenshot, domString, stepCount);

        // 3. Get response from Claude
        onStatusUpdate({
          isRunning: true,
          currentStep: stepCount,
          totalSteps: MAX_STEPS,
          thought: 'Thinking...',
        });

        const response = await callClaude(
          companion.systemPrompt,
          this.history,
          userMessage
        );

        // 4. Parse the response
        const agentResponse = this.parseResponse(response);

        // Update status with thought
        onStatusUpdate({
          isRunning: true,
          currentStep: stepCount,
          totalSteps: MAX_STEPS,
          thought: agentResponse.thought,
          currentAction: agentResponse.action,
        });

        // Record the step
        const step: AgentStep = {
          thought: agentResponse.thought,
          action: {
            type: agentResponse.action,
            selector: agentResponse.selector,
            value: agentResponse.value,
            direction: agentResponse.direction,
          },
          screenshot,
          result: agentResponse.result,
        };
        this.steps.push(step);

        // Add to history
        this.history.push({
          role: 'user',
          content: userMessage,
        });
        this.history.push({
          role: 'assistant',
          content: response,
        });

        // 5. Check if done
        if (agentResponse.done || agentResponse.action === 'done') {
          return {
            success: true,
            result: agentResponse.result || 'Task completed',
            steps: this.steps,
          };
        }

        // 6. Build action
        const action: BrowserAction = {
          type: agentResponse.action as BrowserAction['type'],
          selector: agentResponse.selector,
          value: agentResponse.value,
          direction: agentResponse.direction as 'up' | 'down' | undefined,
          amount: agentResponse.amount,
        };

        // 7. Check if approval required
        if (this.needsApproval(action, companion)) {
          const description = this.describeAction(action, agentResponse.thought);
          const approved = await requestApproval(action, description);

          if (!approved) {
            return {
              success: false,
              error: 'Action denied by user',
              steps: this.steps,
            };
          }
        }

        // 8. Execute action
        onStatusUpdate({
          isRunning: true,
          currentStep: stepCount,
          totalSteps: MAX_STEPS,
          thought: `Executing: ${action.type}`,
          currentAction: action.type,
        });

        const actionResult = await window.electronAPI.executeAction(action);

        if (!actionResult.success) {
          // Add error to history so agent can try again
          this.history.push({
            role: 'user',
            content: `Error executing action: ${actionResult.error}. Please try a different approach.`,
          });
        }

        // Wait for page to update
        await this.delay(STEP_DELAY);

        // Extra delay for navigation
        if (action.type === 'navigate' || action.type === 'click') {
          await this.delay(1000);
        }
      }

      // Max steps reached
      return {
        success: false,
        error: 'Maximum steps reached without completing task',
        steps: this.steps,
      };
    } catch (error) {
      console.error('Agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        steps: this.steps,
      };
    }
  }

  private buildUserMessage(
    goal: string,
    _screenshot: string, // Screenshot is passed separately to Claude API
    dom: string,
    step: number
  ): string {
    const isFirstStep = step === 1;

    if (isFirstStep) {
      return `Goal: ${goal}

Current page (screenshot attached)

DOM structure (simplified):
${dom.substring(0, 10000)}

What is the first action to take?`;
    }

    return `Screenshot of current page state attached.

DOM structure (simplified):
${dom.substring(0, 10000)}

What is the next action?`;
  }

  private parseResponse(response: string): AgentResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          thought: parsed.thought || 'No thought provided',
          action: parsed.action || 'done',
          selector: parsed.selector,
          value: parsed.value,
          direction: parsed.direction,
          amount: parsed.amount,
          done: parsed.done || parsed.action === 'done',
          result: parsed.result,
        };
      }

      // If no JSON, treat as done with the response as result
      return {
        thought: 'Completed task',
        action: 'done',
        done: true,
        result: response,
      };
    } catch {
      console.error('Failed to parse agent response:', response);
      return {
        thought: 'Error parsing response',
        action: 'done',
        done: true,
        result: response,
      };
    }
  }

  private needsApproval(action: BrowserAction, companion: Companion): boolean {
    // Check if this action type requires approval for this companion
    const approvalActions = companion.approvalRequired;

    // Sensitive actions that might need approval
    const sensitivePatterns = [
      { pattern: /submit/i, type: 'submit' },
      { pattern: /send/i, type: 'send_message' },
      { pattern: /connect/i, type: 'connect' },
      { pattern: /checkout/i, type: 'checkout' },
      { pattern: /buy/i, type: 'checkout' },
      { pattern: /add.?to.?cart/i, type: 'add_to_cart' },
    ];

    if (action.type === 'click' && action.selector) {
      for (const { pattern, type } of sensitivePatterns) {
        if (pattern.test(action.selector) && approvalActions.includes(type)) {
          return true;
        }
      }
    }

    return false;
  }

  private describeAction(action: BrowserAction, thought: string): string {
    switch (action.type) {
      case 'click':
        return `Click on "${action.selector}"\n\nReason: ${thought}`;
      case 'type':
        return `Type "${action.value}" into "${action.selector}"\n\nReason: ${thought}`;
      case 'navigate':
        return `Navigate to ${action.value}\n\nReason: ${thought}`;
      default:
        return `${action.type}\n\nReason: ${thought}`;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
