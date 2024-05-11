import MonacoEditor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import { editorLanguage } from "../../Assets/Data/editorLanguages.data";
import { updateFileBody } from "../../Store/reducres/SideDrawer/Directory/Directory.reducer";
import { useAppDispatch, useAppSelector } from "../../Store/store";
import useDebounce from "../../hooks/useDebounce.hook";
import { mergeClass } from "../../library/tailwindMerge/tailwindMerge.lib";
import Loader from "../UI/Loader/Loader.component";
import "./editor.styles.css";
import useHighlightText from "./hooks/useHighlightText.hook";
import useSetEditorTheme from "./hooks/useSetEditorTheme.hook";
import useUndoRedo from "./hooks/useUndoRedo.hook";

interface IPROPS {
  content: string;
  language: string | undefined;
  currentWorkingFileId: string;
  editorHeight: number;
}

const Editor: React.FC<IPROPS> = ({
  content,
  language,
  currentWorkingFileId,
  editorHeight,
}) => {
  const [isEditorThemeReady, setIsEditorThemeReady] = useState(false);
  const [isEditorMounted, setIsEditorMounted] = useState(false);

  const [editorContent, setEditorContent] = useState(content);

  const dispatch = useAppDispatch();

  const fontSize = useAppSelector((state) => state.editor.fontSize);
  const tabSize = useAppSelector((state) => state.editor.tabSize);
  const wordWrap = useAppSelector((state) => state.editor.wordWrap);
  const isScrollBeyondLastLine = useAppSelector(
    (state) => state.editor.isScrollBeyondLastLine
  );
  const isMinimapEnabled = useAppSelector(
    (state) => state.editor.isMinimapEnabled
  );
  const currEditorTheme = useAppSelector((state) => state.editor.theme);

  const searchedText = useAppSelector((state) => state.search.searchedText);

  const showInSideDrawer = useAppSelector(
    (state) => state.sideDrawer.showInSideDrawer
  );
  const isDrawerOpen = useAppSelector((state) => state.sideDrawer.isDrawerOpen);

  const characterAddRemoveCountDebounce = useRef<{ count: 0 }>({
    count: 0,
  });
  let isCurrentWorkingFileChanged = useRef(true);
  let monacoRef = useRef<null | editor.IStandaloneCodeEditor>(null);

  const { isUndoRedoOperation, updateUndoRedoStack } = useUndoRedo(
    monacoRef,
    setEditorContent,
    isEditorMounted,
    editorContent,
    characterAddRemoveCountDebounce
  );

  const { highlightText } = useHighlightText();

  useSetEditorTheme(setIsEditorThemeReady);

  // this is to update the file body in the redux store when the editor content changes
  const updateFileBodyStore = (content: string) => {
    dispatch(updateFileBody([{ id: currentWorkingFileId, body: content }]));
  };

  const debounceUpdateFileBodyStore = useDebounce(updateFileBodyStore, 600);

  const debounceUpdateHightlightText = useDebounce(highlightText, 400);

  const debounceUpdateUndoRedoStack = useDebounce(updateUndoRedoStack, 200);

  const onChangeHandler = (value: string | undefined) => {
  
    if (isCurrentWorkingFileChanged.current || value === undefined) {
      isCurrentWorkingFileChanged.current = false;
      return;
    }

    setEditorContent(value);
    debounceUpdateFileBodyStore(value);

    if (!isUndoRedoOperation.current) {
      if (!characterAddRemoveCountDebounce.current.count)
        characterAddRemoveCountDebounce.current.count = 0;
      characterAddRemoveCountDebounce.current.count +=
        editorContent.length - value.length;
      debounceUpdateUndoRedoStack(value);
    } else isUndoRedoOperation.current = false;
  };

  useEffect(() => {
    isCurrentWorkingFileChanged.current = true;
    setEditorContent(content);
  }, [currentWorkingFileId]);

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  useEffect(() => {
    debounceUpdateHightlightText(
      searchedText,
      showInSideDrawer,
      isDrawerOpen,
      currentWorkingFileId
    );
  }, [
    isEditorMounted,
    showInSideDrawer,
    searchedText,
    currentWorkingFileId,
    isDrawerOpen,
    content,
  ]);
  
  return (
    <div
      className={mergeClass([
        "bg-[color:var(--codeeditor-color)]  code-here",
        editorHeight < 2 && "hidden",
      ])}
      style={{ height: editorHeight }}
    >
      {isEditorThemeReady ? (
        <MonacoEditor
          language={
            !language
              ? "plaintext"
              : editorLanguage[language]
              ? editorLanguage[language]
              : "plaintext"
          }
          theme={currEditorTheme}
          loading={<Loader type="editorLoader" />}
          options={{
            wordWrap: wordWrap,
            lineNumbersMinChars: 3, // for the line numbers at the left
            fontSize: fontSize,
            tabSize: tabSize,
            minimap: {
              enabled: isMinimapEnabled,
            },
            scrollBeyondLastLine: isScrollBeyondLastLine,
            automaticLayout: true,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
          }}
          value={editorContent}
          onChange={onChangeHandler}
          onMount={(editor) => {
            monacoRef.current = editor;
            isCurrentWorkingFileChanged.current = false;
            setIsEditorMounted(true);
          }}
        ></MonacoEditor>
      ) : (
        <Loader type="editorLoader" />
      )}
    </div>
  );
};

export default Editor;
