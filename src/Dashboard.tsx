import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, ShieldCheck, Activity, Send, Settings, Upload } from 'lucide-react';

const Dashboard = () => {
  const [vpnStatus, setVpnStatus] = useState('disconnected');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Welcome to DuckAI Advanced Management. VPN is currently disconnected.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: newMessages
        })
      });
      const data = await response.json();
      setMessages([...newMessages, data.choices[0].message]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="text-blue-500" /> DuckAI Advanced
            </h1>
            <p className="text-zinc-400">Future-proof Management Console</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={vpnStatus === 'connected' ? 'success' : 'destructive'} className="px-3 py-1">
              {vpnStatus === 'connected' ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldAlert className="w-4 h-4 mr-1" />}
              VPN {vpnStatus}
            </Badge>
            <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-zinc-100">
                  <Activity className="text-green-500" /> Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4 mb-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex gap-2">
                  <Input 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message..." 
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={loading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">WireGuard VPN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-zinc-500 hover:border-zinc-700 transition-colors">
                  <Upload className="w-8 h-8 mb-2" />
                  <p className="text-sm">Upload .conf file</p>
                  <Button variant="ghost" size="sm" className="mt-4">Select File</Button>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setVpnStatus('connected')}>
                  Connect VPN
                </Button>
                <p className="text-xs text-zinc-500 text-center">System will auto-restart upon connection</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">System Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Rate Limit</span>
                  <span className="text-green-400">Unlimited (VPN)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Latency</span>
                  <span className="text-zinc-100">42ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Uptime</span>
                  <span className="text-zinc-100">99.9%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
