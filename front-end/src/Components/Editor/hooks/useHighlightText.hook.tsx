import { useMonaco } from "@monaco-editor/react";
import { useRef } from "react";
import { DrawerContent } from "../../../Store/reducres/SideDrawer/SideDrawer.reducer";
import { useAppSelector } from "../../../Store/store";

const CSS_CLASSNAME_HIGHLIGHT_SUFFFIX = "-highlight";

const useHighlightText = () => {
  const monaco = useMonaco();
  const currFile = useAppSelector(
    (state) => state.fileNavigation.currentNavFile
  );
  const editorTheme = useAppSelector((state) => state.editor.theme);
  // storing the prev decorations of all the files if they are used in search so that we can remove the prev change and apply the new one
  let previousDecorations = useRef<{
    [key: string]: Array<string>;
  }>({});

  // if the file is not present in the previousDecoration then we add it to the previousDecoration
  if (!previousDecorations.current[currFile.id]) {
    previousDecorations.current[currFile.id] = Array<string>();
  }

  const highlightText = (
    searchedText: string,
    showInSideDrawer: DrawerContent,
    isDrawerOpen: boolean
  ) => {
    if (!monaco || monaco.editor.getModels().length === 0) return;

  
    const matches = monaco.editor
      .getModels()[0]
      .findMatches(searchedText, true, false, false, null, false);

  
    const previousDecor = previousDecorations.current[currFile.id];

  
    monaco.editor.getModels()[0].deltaDecorations(previousDecor, []);

    if (
      searchedText.length === 0 ||
      matches.length === 0 ||
      !isDrawerOpen ||
      showInSideDrawer !== "search"
    ) {
      previousDecorations.current![currFile.id]?.splice(
        0,
        previousDecorations.current![currFile.id].length
      );
      return;
    }

    
    const newDecorations = Array<string>();

    
    matches.forEach((match) => {
    
      newDecorations.push(
        monaco.editor.getModels()[0].deltaDecorations(
          [],
          [
            {
              range: match.range,
              options: {
                isWholeLine: false,
                inlineClassName: editorTheme + CSS_CLASSNAME_HIGHLIGHT_SUFFFIX,
                minimap: {
                  position: 1,
                  color: "red",
                },
                overviewRuler: {
                  position: 1,
                  color: "red",
                },
                // its used to avoid the change of the background of the unwanted text read about the prop in detail in doc
                stickiness:
                  monaco.editor.TrackedRangeStickiness
                    .NeverGrowsWhenTypingAtEdges,
              },
            },
          ]
        )[0]
      );
    });


    previousDecorations.current![currFile.id].splice(
      0,
      previousDecorations.current![currFile.id].length
    );


    for (const decor of newDecorations) {
      previousDecorations.current![currFile.id].push(decor);
    }
  };
  return {
    highlightText,
  };
};

export default useHighlightText;
