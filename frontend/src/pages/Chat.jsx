import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSend } from 'react-icons/fi';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    // If redirected with a chat target
    const targetUserId = searchParams.get('to');
    if (targetUserId && user) {
      const conversationId = [user.id || user._id, targetUserId].sort().join('_');
      setActiveConversation({ conversationId, otherUser: { _id: targetUserId, name: 'Host' } });
      fetchMessages(conversationId);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      socket.on('newMessageNotification', ({ conversationId, message }) => {
        if (activeConversation?.conversationId !== conversationId) {
          fetchConversations();
        }
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('newMessageNotification');
      };
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await API.get('/messages/conversations/list');
      setConversations(data.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data } = await API.get(`/messages/${conversationId}`);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectConversation = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv.conversationId);
    if (socket) {
      socket.emit('joinConversation', conv.conversationId);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const receiverId = activeConversation.otherUser?._id;
    const senderId = user.id || user._id;

    if (socket) {
      socket.emit('sendMessage', {
        senderId,
        receiverId,
        text: newMessage,
      });
    }

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const userId = user?.id || user?._id;

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>💬 Messages</h2>
        </div>
        {loading ? (
          <div className="loader" style={{ minHeight: 100 }}><div className="spinner"></div></div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No conversations yet. Chat with a host from their listing page!
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.conversationId}
              className={`chat-conversation-item ${activeConversation?.conversationId === conv.conversationId ? 'active' : ''}`}
              onClick={() => selectConversation(conv)}
            >
              <div className="avatar">{getInitials(conv.otherUser?.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{conv.otherUser?.name || 'User'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <span style={{
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}>{conv.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <div className="avatar" style={{ width: 40, height: 40, background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                {getInitials(activeConversation.otherUser?.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{activeConversation.otherUser?.name || 'User'}</div>
              </div>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => {
                const isSent = (msg.sender?._id || msg.sender) === userId;
                return (
                  <div key={msg._id || index} className={`chat-message ${isSent ? 'sent' : 'received'}`}>
                    <div>{msg.text}</div>
                    <div className="chat-message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <FiSend size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
              <h3 style={{ color: 'var(--text-secondary)' }}>Select a conversation</h3>
              <p>Or start chatting with a host from their listing page</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

