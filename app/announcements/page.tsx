'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '../components/custom/States';
import { 
  AnnouncementsIcon, 
  FilterIcon, 
  SearchIcon 
} from '../components/icons';
import { mockAnnouncements } from '../data/mockData';

export default function AnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const categories = ['all', 'school', 'class', 'urgent'];
  const allTags = Array.from(new Set(mockAnnouncements.flatMap(a => a.tags)));

  const filteredAnnouncements = mockAnnouncements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || announcement.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="mt-1 text-sm text-gray-600">
          Stay updated with school and class announcements
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="pl-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          Showing {filteredAnnouncements.length} of {mockAnnouncements.length} announcements
        </p>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-6">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      variant={
                        announcement.category === 'urgent' ? 'destructive' :
                        announcement.category === 'school' ? 'default' : 'outline'
                      }
                      className="text-xs"
                    >
                      {announcement.category}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(announcement.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {announcement.title}
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {announcement.content}
                  </p>
                  
                  {/* Tags */}
                  {announcement.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {announcement.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Author */}
                  <div className="flex items-center text-sm text-gray-600">
                    <span>Posted by {announcement.author}</span>
                  </div>
                </div>

                {/* Priority Indicator */}
                {announcement.category === 'urgent' && (
                  <div className="ml-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                      <AnnouncementsIcon className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAnnouncements.length === 0 && (
          <EmptyState
            icon={AnnouncementsIcon}
            title="No announcements found"
            description={
              searchQuery || selectedCategory !== 'all' || selectedTag !== 'all'
                ? "Try adjusting your filters to see more announcements"
                : "There are no announcements at this time"
            }
            action={
              (searchQuery || selectedCategory !== 'all' || selectedTag !== 'all') ? {
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedTag('all');
                }
              } : undefined
            }
          />
        )}
      </div>

      {/* Load More (Pagination Placeholder) */}
      {filteredAnnouncements.length > 10 && (
        <div className="mt-8 text-center">
          <Button variant="outline">Load More Announcements</Button>
        </div>
      )}
    </div>
  );
}