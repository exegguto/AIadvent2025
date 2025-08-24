import { LLMResponse, ProjectContext, ChatMessage } from '../types/index.js';
export declare class LLMService {
    private openai;
    private agent;
    constructor();
    processMessage(userMessage: string, sessionHistory?: ChatMessage[], projectContext?: ProjectContext): Promise<LLMResponse>;
    private buildSystemPrompt;
    private buildMessages;
    private formatMessageContent;
    private parseResponse;
    private extractCodeBlocks;
    private extractText;
    private extractSuggestions;
}
export declare const llmService: LLMService;
//# sourceMappingURL=llm.service.d.ts.map