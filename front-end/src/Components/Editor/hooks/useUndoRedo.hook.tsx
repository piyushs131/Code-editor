import { useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useEffect, useRef } from "react";
import { IUndoRedo } from "../../../@types/undoRedo.d";
import { useAppDispatch, useAppSelector } from "../../../Store/store";
import {
  getFromLocalStorage,
  storeToLocalStorage,
} from "../../../utils/localStorage.utils";

const useUndoRedo = (
  monacoRef: React.RefObject<editor.IStandaloneCodeEditor>,
  setEditorContent: Function,
  isEditorMounted: boolean,
  content: string,
  countOfCharacterRemoved: React.RefObject<{ count: number }>
) => {
  const dispatch = useAppDispatch();

  let undoRedoHistoryInfo = useRef<IUndoRedo>(
    getFromLocalStorage("codeverse-history-info") || {}
  );

  let isUndoRedoOperation = useRef<boolean>(false);

  const currFile = useAppSelector(
    (state) => state.fileNavigation.currentNavFile
  );

  const filesInformation = useAppSelector(
    (state) => state.Directory.filesInformation
  );

  const undoRedoHistory = undoRedoHistoryInfo.current;
  const monaco = useMonaco();

  if (!undoRedoHistoryInfo.current[currFile.id]) {
    undoRedoHistoryInfo.current[currFile.id] = {
      stack: [
        {
          cursorPosition: { lineNumber: 0, column: 0 },
          content: filesInformation[currFile.id].body,
        },
      ],
      pointer: 1,
    };
  }

  useEffect(() => {
    if (!monacoRef.current || !monaco) return;

    monacoRef.current.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ,
      () => {
        const currentFileUndoRedo = undoRedoHistoryInfo.current[currFile.id];

        if (currentFileUndoRedo.pointer < currentFileUndoRedo.stack.length) {
          currentFileUndoRedo.pointer++;
          isUndoRedoOperation.current = true;

          setEditorContent(
            currentFileUndoRedo.stack[currentFileUndoRedo.pointer - 1].content
          );

          setTimeout(() => {
            if (
              currentFileUndoRedo.stack.length === currentFileUndoRedo.pointer
            )
              return;
            monacoRef.current?.setPosition(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition
            );

            monacoRef.current?.revealLine(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition.lineNumber
            );
          }, 0);
        }
      }
    );

    // redo for the windows ctrl+y
    monacoRef.current.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY,
      () => {
        const currentFileUndoRedo = undoRedoHistoryInfo.current[currFile.id];

        if (currentFileUndoRedo.pointer < currentFileUndoRedo.stack.length) {
          currentFileUndoRedo.pointer++;
          isUndoRedoOperation.current = true;

          // as pointer is 1 based indexing so we need to decrement it by 1 to get the correct index of the stack
          setEditorContent(
            currentFileUndoRedo.stack[currentFileUndoRedo.pointer - 1].content
          );

          setTimeout(() => {
            monacoRef.current?.setPosition(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition
            );

            monacoRef.current?.revealLine(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition.lineNumber
            );
          }, 0);
        }
      }
    );

    monacoRef.current.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ,
      () => {
        const currentFileUndoRedo = undoRedoHistoryInfo.current[currFile.id];

        if (currentFileUndoRedo.pointer > 1) {
          currentFileUndoRedo.pointer--;
          isUndoRedoOperation.current = true;

          setEditorContent(
            currentFileUndoRedo.stack[currentFileUndoRedo.pointer - 1].content
          );

    
          setTimeout(() => {
    
            monacoRef.current?.setPosition(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition
            );

    
            monacoRef.current?.revealLine(
              currentFileUndoRedo.stack[currentFileUndoRedo.pointer]
                .cursorPosition.lineNumber
            );
          }, 0);
        }
      }
    );
    return () => {
      storeToLocalStorage("codeverse-history-info", undoRedoHistory);
    };
 
  }, [
    monacoRef,
    monaco,
    currFile.id,
    isEditorMounted,
    setEditorContent,
    dispatch,
  ]);


  const updateUndoRedoStack = (value: string) => {
    let cursorPosition = monacoRef.current?.getPosition();
    const currentFileUndoRedo = undoRedoHistoryInfo.current[currFile.id];


    if (currentFileUndoRedo.pointer !== currentFileUndoRedo.stack.length) {
      currentFileUndoRedo.stack = currentFileUndoRedo.stack.slice(
        0,
        currentFileUndoRedo.pointer
      );
    }

    currentFileUndoRedo.stack.push({
      cursorPosition: {
        lineNumber: cursorPosition ? cursorPosition.lineNumber : 0,
        column: cursorPosition
          ? cursorPosition.column + countOfCharacterRemoved.current?.count!
          : 0,
      },
      content: value,
    });
    if (countOfCharacterRemoved.current)
      countOfCharacterRemoved.current.count = 0;

    currentFileUndoRedo.pointer++;
  };

  return {
    undoRedoHistoryInfo,
    isUndoRedoOperation,
    updateUndoRedoStack,
  };
};

export default useUndoRedo;
