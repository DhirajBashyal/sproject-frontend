export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  query: string;
  answer: string;
  context: string; // retrieved source text; do not show to visitors
  history: ChatTurn[];
}

export interface WidgetSettings {
  initial_message: string;
  widget_alignment: "left" | "right";
  background_color: string;
  user_bubble_color: string;
  bot_bubble_color: string;
  faqs: string[];
}
