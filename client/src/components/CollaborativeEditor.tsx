import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
import debounce from "lodash/debounce";
import { getRoomNote } from "../api/roomService";

interface EditorProps {
  roomId: string;
  socket: Socket | null;
}

export const CollaborativeEditor = ({
  roomId,
  socket,
}: EditorProps) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Loading notes...</p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl prose-invert max-w-none focus:outline-none min-h-[400px] p-4 text-neutral-300",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      socket?.emit("send-changes", {
        roomId,
        content: html,
        userId: user?._id,
      });

      debouncedSave(html);
    },
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const data = await getRoomNote(roomId);
        if (editor) {
          editor.commands.setContent(data.content);
        }
      } catch (error) {
        console.error("Failed to load initial note:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (editor) {
      fetchNote();
    }
  }, [roomId, editor]);

  // Debounce the save event so it only hits MongoDB 2 seconds AFTER the user stops typing
  const debouncedSave = useCallback(
    // eslint-disable-next-line react-hooks/use-memo
    debounce((html: string) => {
      socket?.emit("save-document", {
        roomId,
        content: html,
        userId: user?._id,
      });
    }, 2000),
    [socket, roomId, user],
  );

  useEffect(() => {
    if (!socket || !editor) return;

    const handleReceiveChanges = (content: string) => {
      // Only update if the content actually changed to avoid cursor jumping
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    };

    socket.on("receive-changes", handleReceiveChanges);

    return () => {
      socket.off("receive-changes", handleReceiveChanges);
    };
  }, [socket, editor]);

  return (
    <div className="border border-neutral-800 rounded-2xl shadow-xl bg-neutral-900 overflow-hidden w-full relative">
      <div className="bg-neutral-800/50 p-4 border-b border-neutral-800 text-sm md:text-base text-white font-semibold flex justify-between">
        <span>Shared Room Notes</span>
        {isLoading && <span className="text-xs text-indigo-400 animate-pulse">Syncing...</span>}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
