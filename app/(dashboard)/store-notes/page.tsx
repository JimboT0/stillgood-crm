"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Filter, Star, MessageSquare, Calendar, User, MapPin, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { 
  getAllStoreNotes, 
  getFilteredStoreNotes, 
  addFeedbackToNote, 
  updateStoreNoteRating,
  StoreNote 
} from "@/lib/firebase/store-notes";
import { PROVINCES } from "@/lib/firebase/types";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";

export default function StoreNotesPage() {
  const { currentUser } = useDashboardData();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<StoreNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<StoreNote[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Feedback states
  const [feedbackText, setFeedbackText] = useState<Map<string, string>>(new Map());
  const [editingRating, setEditingRating] = useState<string | null>(null);

  // Fetch all notes
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const allNotes = await getAllStoreNotes();
      setNotes(allNotes);
      setFilteredNotes(allNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to fetch store notes");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      const filters: any = {};
      
      if (selectedProvince !== "all") filters.province = selectedProvince;
      if (selectedAuthor !== "all") filters.author = selectedAuthor;
      if (minRating !== "all") filters.minRating = parseInt(minRating);
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      
      let filtered = notes;
      
      // Apply search term filter
      if (searchTerm.trim()) {
        filtered = filtered.filter(note => 
          note.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply other filters
      if (selectedProvince !== "all") {
        filtered = filtered.filter(note => note.province === selectedProvince);
      }
      
      if (selectedAuthor !== "all") {
        filtered = filtered.filter(note => note.author === selectedAuthor);
      }
      
      if (minRating !== "all") {
        filtered = filtered.filter(note => note.rating >= parseInt(minRating));
      }
      
      if (dateFrom || dateTo) {
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.timestamp);
          const fromDate = dateFrom ? new Date(dateFrom) : null;
          const toDate = dateTo ? new Date(dateTo) : null;
          
          if (fromDate && noteDate < fromDate) return false;
          if (toDate && noteDate > toDate) return false;
          return true;
        });
      }
      
      setFilteredNotes(filtered);
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Error applying filters");
    }
  };

  // Get unique authors for filter
  const authors = useMemo(() => {
    const uniqueAuthors = Array.from(new Set(notes.map(note => note.author)));
    return uniqueAuthors.sort();
  }, [notes]);

  // Add feedback to note
  const addFeedback = async (noteId: string) => {
    if (!noteId) {
      toast.error("Invalid note ID");
      return;
    }
    
    const feedbackMessage = feedbackText.get(noteId);
    if (!feedbackMessage?.trim()) {
      toast.error("Please enter feedback message");
      return;
    }

    if (!currentUser) {
      toast.error("You must be logged in to add feedback");
      return;
    }

    try {
      await addFeedbackToNote(noteId, {
        author: currentUser.name || "Unknown User",
        role: currentUser.role || "User",
        email: currentUser.email || "",
        message: feedbackMessage.trim(),
        timestamp: new Date().toISOString(),
      });

      // Refresh notes
      await fetchNotes();
      
      setFeedbackText(prev => {
        const updated = new Map(prev);
        updated.set(noteId, "");
        return updated;
      });
      
      toast.success("Feedback added successfully!");
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    }
  };

  // Update note rating
  const updateNoteRating = async (noteId: string, newRating: number) => {
    if (!noteId) {
      toast.error("Invalid note ID");
      return;
    }
    
    try {
      await updateStoreNoteRating(noteId, newRating);
      await fetchNotes();
      setEditingRating(null);
      toast.success("Rating updated successfully!");
    } catch (error) {
      console.error("Error updating rating:", error);
      toast.error("Failed to update rating");
    }
  };

  // Render star rating
  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedProvince, selectedAuthor, minRating, dateFrom, dateTo, notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Implementation Notes</h1>
          <p className="text-muted-foreground">View and filter all store improvement notes and feedback</p>
        </div>
        <Button onClick={fetchNotes} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger>
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.filter(p => p !== "_").map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger>
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>{author}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger>
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Showing {filteredNotes.length} of {notes.length} notes</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No notes found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note, index) => (
            <Card key={note.id || `note-${index}`} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{note.storeName}</h3>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {note.province}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {note.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingRating === note.id && note.id ? (
                      <div className="flex items-center gap-2">
                        {renderStars(note.rating, true, (rating) => updateNoteRating(note.id!, rating))}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingRating(null)}
                          className="h-6 px-2 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:bg-muted rounded p-1"
                        onClick={() => note.id && setEditingRating(note.id)}
                        title="Click to edit rating"
                      >
                        {renderStars(note.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm">{note.message}</p>
                
                {/* Feedback Section */}
                <div className="border-t pt-4 space-y-4">
                  {/* Add Feedback */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add feedback or comment..."
                      value={feedbackText.get(note.id || '') || ""}
                      onChange={(e) => {
                        if (note.id) {
                          const updated = new Map(feedbackText);
                          updated.set(note.id, e.target.value);
                          setFeedbackText(updated);
                        }
                      }}
                      rows={2}
                      className="text-sm"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => note.id && addFeedback(note.id)}
                      className="self-end"
                      disabled={!note.id}
                    >
                      Reply
                    </Button>
                  </div>
                  
                  {/* Existing Feedback */}
                  {note.feedback && note.feedback.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Feedback ({note.feedback.length})</h4>
                      {note.feedback.map((feedback, index) => (
                        <div key={feedback.id || `feedback-${note.id}-${index}`} className="bg-muted/50 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{feedback.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(feedback.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-xs">{feedback.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}