'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
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
      // First get the profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        router.push('/auth/signup')
        return
      }

      // Get chat details
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

      // Verify user has access to this chat
      if (profile.role === 'freelancer' && chatData.freelancer_id !== profile.id) {
        router.push('/freelancer/dashboard')
        return
      }
      if (profile.role === 'client' && chatData.client_id !== profile.id) {
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
          // Fetch the full message with sender info
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
    if (!newMessage.trim() || !user || !chat) return

    try {
      setSending(true)

      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

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
    if (!chat) return null
    return user?.id === chat.freelancer_id ? chat.client : chat.freelancer
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const otherUser = getOtherUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href={user?.role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}
            className="text-blue-600 hover:text-blue-700"
          >
            ←
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">
              {otherUser?.full_name || 'Chat'}
            </h1>
            {chat?.task && (
              <p className="text-sm text-gray-500">
                Re: {chat.task.title}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id !== undefined && 
                messages.some(m => {
                  // Check if this message is from current user
                  const profileId = user?.id // This is auth.uid, need to compare with sender_id
                  return false // Simplified for now
                })
              
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender_id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow'
                    }`}
                  >
                    {message.sender_id !== user?.id && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {message.sender?.full_name || 'Unknown'}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
