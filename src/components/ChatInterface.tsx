import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, Bot } from "lucide-react";
import { getPerplexityResponse } from "@/services/perplexity";
import { ChatMessage } from "@/types/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownComponents } from "@/components/markdown/MarkdownComponents";
import { useStock } from "@/contexts/StockContext";

const stockMapping: { [key: string]: string } = {
  // BlackRock: "NYSE:BLK",
  // Apple: "NASDAQ:AAPL",
  // Tesla: "NASDAQ:TSLA",
  // Microsoft: "NASDAQ:MSFT",
  "BlackRock": "NYSE:BLK",
  "Apple": "NASDAQ:AAPL",
  "Tesla": "NASDAQ:TSLA",
  "Microsoft": "NASDAQ:MSFT",
  "Google": "NASDAQ:GOOGL",
  "Amazon": "NASDAQ:AMZN",
  "Meta": "NASDAQ:META",
  "Nvidia": "NASDAQ:NVDA",
  "Netflix": "NASDAQ:NFLX",
  "Adobe": "NASDAQ:ADBE",
  "Salesforce": "NYSE:CRM",
  "Intel": "NASDAQ:INTC",
  "Cisco": "NASDAQ:CSCO",
  "PepsiCo": "NASDAQ:PEP",
  "Coca-Cola": "NYSE:KO",
  "Johnson & Johnson": "NYSE:JNJ",
  "Procter & Gamble": "NYSE:PG",
  "Walmart": "NYSE:WMT",
  "Target": "NYSE:TGT",
  "Berkshire Hathaway": "NYSE:BRK.B",
  "Disney": "NYSE:DIS",
  "Visa": "NYSE:V",
  "Mastercard": "NYSE:MA",
  "PayPal": "NASDAQ:PYPL",
  "Square": "NYSE:SQ",
  "Bank of America": "NYSE:BAC",
  "JP Morgan Chase": "NYSE:JPM",
  "Morgan Stanley": "NYSE:MS",
  "Goldman Sachs": "NYSE:GS",
  "Chevron": "NYSE:CVX",
  "ExxonMobil": "NYSE:XOM",
  "Shell": "NYSE:SHEL",
  "Pfizer": "NYSE:PFE",
  "Moderna": "NASDAQ:MRNA",
  "AstraZeneca": "NASDAQ:AZN",
  "Roche": "OTC:RHHBY",
  "Toyota": "NYSE:TM",
  "Ford": "NYSE:F",
  "General Motors": "NYSE:GM",
  "BMW": "OTC:BMWYY",
  "Volkswagen": "OTC:VWAGY",
  "Sony": "NYSE:SONY",
  "Samsung": "KRX:005930",
  "LG": "KRX:066570",
};

function extractStockSymbol(message: string): string | null {
  for (const company in stockMapping) {
    if (message.toLowerCase().includes(company.toLowerCase())) {
      return stockMapping[company];
    }
  }
  return null;
}

export const ChatInterface: React.FC = () => {
  const { setStockSymbol } = useStock();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm Tradie, your AI trading copilot. I can help you understand market events, analyze stock movements, and provide insights about company performance. Feel free to ask me anything about the markets!",
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await getPerplexityResponse(input);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.content,
        citations: response.citations,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const symbol = extractStockSymbol(response.content);
      if (symbol) {
        setStockSymbol(symbol);
      }
    } catch (error) {
      console.error("Error getting response:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Chat with Tradie</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Ask me about market events, stock movements, or company news</p>
      </div>
      
      <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
        <ScrollArea className="flex-1 h-[calc(100vh-13rem)] pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <Card key={index} className={`p-4 ${message.role === "assistant" ? "bg-primary/10" : "bg-secondary/10"}`}>
                <p className="text-sm font-semibold">{message.role === "assistant" ? "Tradie" : "You"}</p>
                <div className="mt-2 text-sm prose prose-invert max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="markdown-content"
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.citations.map((citation, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-xs hover:bg-primary/20"
                        onClick={() => window.open(citation, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source {idx + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-primary p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Finding Relevant Information...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about market events..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
