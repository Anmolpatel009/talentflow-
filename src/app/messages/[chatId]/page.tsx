'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, Spinner } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  message_type: string
  sender_id: string
  created_at: string
  sender?: {
    full_name: string
  }
}

interface Chat {
  id: string
  task_id: string
  freelancer_id: string
  client_id: string
  task?: {
    title: string
  }
  freelancer?: {
    id: string
    full_name: string
  }
  client?: {
    id: string
    full_name: string
  }
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true)
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [chatId])

  useEffect(() => {
    if (chatId) {
      subscribeToMessages()
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      fetchChat(user.id)
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    }
  }

  const fetchChat = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!profileData) {
        router.push('/auth/signup')
        return
      }

      setProfile(profileData)

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          task:task_id (
            title
          ),
          freelancer:freelancer_id (
            id,
            full_name
          ),
          client:client_id (
            id,
            full_name
          )
        `)
        .eq('id', chatId)
        .single()

      if (chatError || !chatData) {
        router.push('/client/dashboard')
        return
      }

      if (profileData.role === 'freelancer' && chatData.freelancer_id !== profileData.id) {
        router.push('/freelancer/dashboard')
        return
      }
      if (profileData.role === 'client' && chatData.client_id !== profileData.id) {
        router.push('/client/dashboard')
        return
      }

      setChat(chatData as any)
      fetchMessages()
    } catch (error) {
      console.error('Error fetching chat:', error)
      router.push('/client/dashboard')
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            full_name
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id (
                full_name
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as any])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !chat || !profile) return

    try {
      setSending(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: profile.id,
          content: newMessage,
          message_type: 'text',
        })

      if (error) throw error

      setNewMessage('')
    } catch (error: any) {
      alert(`Error sending message: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getOtherUser = () => {
    if (!chat || !profile) return null
    return profile.id === chat.freelancer_id ? chat.client : chat.freelancer
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === profile?.id
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" variant="primary" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  const otherUser = getOtherUser()
  const dashboardPath = profile?.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={dashboardPath}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <div className="flex items-center gap-3 flex-1">
              <Avatar name={otherUser?.full_name || 'User'} size="lg" showStatus status="online" />
              <div>
                <h1 className="font-semibold text-foreground">
                  {otherUser?.full_name || 'Chat'}
                </h1>
                {chat?.task && (
                  <p className="text-sm text-muted-foreground">
                    Re: {chat.task.title}
                  </p>
                )}
              </div>
            </div>

            {/* Task Link */}
            {chat?.task_id && (
              <Link
                href={`${profile?.role === 'client' ? '/client' : '/freelancer'}/tasks/${chat.task_id}`}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="No messages yet"
                description="Start the conversation by sending a message below!"
              />
            </div>
          ) : (
            <>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-6">
                <div className="px-4 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {messages.map((message, index) => {
                const isOwn = isOwnMessage(message)
                const showAvatar = index === 0 || messages[index - 1]?.sender_id !== message.sender_id
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 animate-fade-in-up',
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <Avatar 
                        name={message.sender?.full_name || 'User'} 
                        size="sm"
                        className="flex-shrink-0 mt-1"
                      />
                    ) : (
                      <div className="w-8" />
                    )}
                    
                    {/* Message Bubble */}
                    <div className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-3',
                      isOwn 
                        ? 'bg-gradient-to-br from-primary to-secondary text-white rounded-tr-md' 
                        : 'bg-card border border-border rounded-tl-md'
                    )}>
                      {!isOwn && showAvatar && (
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {message.sender?.full_name || 'Unknown'}
                        </p>
                      )}
                      <p className={cn(
                        'whitespace-pre-wrap break-words',
                        isOwn ? 'text-white' : 'text-foreground'
                      )}>
                        {message.content}
                      </p>
                      <p className={cn(
                        'text-xs mt-1.5 flex items-center gap-1',
                        isOwn ? 'text-white/70 justify-end' : 'text-muted-foreground'
                      )}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOwn && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <Avatar name={otherUser?.full_name || 'User'} size="sm" />
              <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-card/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={sendMessage} className="flex items-end gap-3">
            {/* Attachment Button */}
            <button
              type="button"
              className="p-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(e)
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 rounded-2xl bg-muted border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={sending}
              />
            </div>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="rounded-xl px-4"
              leftIcon={
                sending ? (
                  <Spinner size="sm" variant="white" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )
              }
            >
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
          
          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
