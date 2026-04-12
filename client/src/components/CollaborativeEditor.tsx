import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
import debounce from "lodash/debounce";

interface EditorProps {
  roomId: string;
  socket: Socket | null;
  initialContent?: string;
}

export const CollaborativeEditor = ({
  roomId,
  socket,
  initialContent = "<p>Start taking notes...</p>",
}: EditorProps) => {
  const { user } = useAuthStore();

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] p-4",
      },
    },
    // This fires every time the user types a keystroke
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      // 1. Send to other users instantly for real-time feel
      socket?.emit("send-changes", {
        roomId,
        content: html,
        userId: user?._id,
      });

      // 2. Trigger the debounced database save
      debouncedSave(html);
    },
  });

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
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden w-full">
      <div className="bg-gray-100 p-2 border-b text-sm text-gray-500 font-semibold">
        Shared Room Notes
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
