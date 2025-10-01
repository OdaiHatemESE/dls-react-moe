"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { EmptyState } from '../components/custom/States';
import { 
  MessagesIcon, 
  PlusIcon, 
  SearchIcon,
  
} from '../components/icons';
import { mockMessageThreads, mockMessages } from '../data/mockData';
import { useI18n } from "@/app/i18n/I18nProvider";
import clsx from "clsx";

export default function MessagesPage() {
  const { t, locale } = useI18n();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = mockMessageThreads.filter(thread =>
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedThreadData = selectedThread 
    ? mockMessageThreads.find(t => t.id === selectedThread)
    : null;

  const threadMessages = selectedThread
    ? mockMessages.filter(m => m.threadId === selectedThread)
    : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending message
    alert('Message sent! (This is a demo)');
    setNewMessage({ to: '', subject: '', content: '' });
    setShowNewMessageModal(false);
  };

  return (
    <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", locale === 'ar' && 'direction-rtl')}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.messages.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{t.messages.subtitle}</p>
        </div>
        <Button
          onClick={() => setShowNewMessageModal(true)}
          className={clsx("flex items-center gap-2")}
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t.messages.newMessage}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Message Threads List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.messages.conversations}</CardTitle>
                <Badge variant="default" className="text-xs">
                  {filteredThreads.length}
                </Badge>
              </div>
              {/* Search */}
              <div className="relative">
                <SearchIcon className={clsx("absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 is-3")} />
                <Input
                  placeholder={t.messages.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={clsx('ps-10')}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors ${
                      selectedThread === thread.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={clsx("flex items-center gap-2 mb-1")}>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {thread.participants.filter(p => p !== 'Parent').join(', ')}
                          </p>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1 truncate">
                          {thread.subject}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {thread.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(thread.lastMessageTime).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredThreads.length === 0 && (
                  <div className="p-4">
                    <EmptyState
                      icon={MessagesIcon}
                      title={t.messages.noConversationsTitle}
                      description={t.messages.noConversationsDesc}
                      action={{
                        label: t.messages.newMessage,
                        onClick: () => setShowNewMessageModal(true)
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Conversation */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            {selectedThreadData ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedThreadData.subject}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {selectedThreadData.participants.filter(p => p !== 'Parent').join(', ')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {threadMessages.map((message) => (
                      <div
                        key={message.id}
                        className={clsx('flex', message.from === 'Parent' ? 'justify-end' : 'justify-start')}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.from === 'Parent' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium opacity-75">
                              {message.from}
                            </p>
                            <p className="text-xs opacity-75">
                              {new Date(message.timestamp).toLocaleTimeString(locale)}
                            </p>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                {/* Reply Form */}
                <div className="border-t border-gray-200 p-4">
                  <form className={clsx("flex gap-2")}>
                    <Input
                      placeholder={t.messages.dialog.typeMessage}
                      className="flex-1"
                    />
                    <Button type="submit" size="sm">
                      {t.common.send}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={MessagesIcon}
                  title={t.messages.selectConversationTitle}
                  description={t.messages.selectConversationDesc}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Message Modal */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.messages.dialog.newMessage}</DialogTitle>
            <DialogDescription>{t.messages.dialog.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.messages.dialog.to}</label>
              <Select
                value={newMessage.to}
                onValueChange={(val) => setNewMessage((prev) => ({ ...prev, to: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.messages.dialog.selectTeacher} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms-martinez">Ms. Martinez</SelectItem>
                  <SelectItem value="mr-thompson">Mr. Thompson</SelectItem>
                  <SelectItem value="school-nurse">School Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.messages.dialog.subject}</label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder={t.messages.dialog.enterSubject}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.messages.dialog.message}</label>
              <Textarea
                rows={4}
                value={newMessage.content}
                onChange={(e) => setNewMessage((prev) => ({ ...prev, content: e.target.value }))}
                placeholder={t.messages.dialog.typeMessage}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewMessageModal(false)}>
                {t.common.cancel}
              </Button>
              <Button type="submit">{t.common.sendMessage}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}