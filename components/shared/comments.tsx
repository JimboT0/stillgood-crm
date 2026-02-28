"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { commentService } from "@/lib/firebase/services/comment";
import { formatDate } from "@/lib/utils/date-formatter";
import type { Comment } from "@/lib/firebase/types";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";

interface CommentsProps {
  reportType: string;
  reportId?: string;
}

const AUTHORIZED_DELETE_EMAIL = "james@stillgood.co.za";

export function Comments({ reportType, reportId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useDashboardData();

  const canDeleteComments = currentUser?.email === AUTHORIZED_DELETE_EMAIL;

  useEffect(() => {
    const unsubscribe = commentService.subscribeToComments(
      reportType,
      setComments,
      reportId
    );

    return unsubscribe;
  }, [reportType, reportId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) {
      toast.error("Please enter a comment");
      return;
    }

    setIsLoading(true);
    try {
      await commentService.addComment({
        text: newComment.trim(),
        createdBy: currentUser.email,
        createdByName: currentUser.name,
        reportType,
        reportId,
      });

      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Error adding comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string, commentCreator: string) => {
    if (!canDeleteComments) {
      toast.error("You don't have permission to delete comments");
      return;
    }

    try {
      await commentService.deleteComment(commentId);
      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Notes
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment */}
        {currentUser && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment or note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={isLoading || !newComment.trim()}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No comments yet. Be the first to add one!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.createdByName}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({comment.createdBy})
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  </div>
                  
                  {canDeleteComments && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id, comment.createdBy)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      title="Delete comment (Admin only)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info message for James */}
        {canDeleteComments && comments.length > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
            <strong>Admin Access:</strong> You can delete any comment as an authorized administrator.
          </div>
        )}
      </CardContent>
    </Card>
  );
}