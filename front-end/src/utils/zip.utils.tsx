import JSZip from "jszip";
import IDirectory from "../@types/directory.d";
import { IFilesInforation } from "../@types/file.d";


export const addAllFilesAndFolderToZipHelper = async (
  zip: JSZip,
  directories: Array<IDirectory>,
  dirPath: string,
  filesInformation: IFilesInforation
) => {
  for (const directory of directories) {
    if (directory.isFolder) {
      await addAllFilesAndFolderToZipHelper(
        zip,
        directory.children,
        dirPath + "/" + directory.name,
        filesInformation
      );
    } else {
      zip.file(
        dirPath + "/" + directory.name,
        new Blob([filesInformation[directory.id].body])
      );
    }
  }
};
