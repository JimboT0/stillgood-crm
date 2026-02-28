import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../config";
import type { Comment } from "../types";

const COLLECTION_NAME = "comments";

class CommentService {
  private collectionRef = collection(db, COLLECTION_NAME);

  async addComment(commentData: Omit<Comment, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(this.collectionRef, {
        ...commentData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw new Error("Failed to add comment");
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, commentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw new Error("Failed to delete comment");
    }
  }

  subscribeToComments(
    reportType: string,
    callback: (comments: Comment[]) => void,
    reportId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [
      where("reportType", "==", reportType),
      orderBy("createdAt", "desc")
    ];

    if (reportId) {
      constraints.splice(1, 0, where("reportId", "==", reportId));
    }

    const q = query(this.collectionRef, ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          text: data.text,
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reportType: data.reportType,
          reportId: data.reportId,
        });
      });
      callback(comments);
    });

    return unsubscribe;
  }
}

export const commentService = new CommentService();