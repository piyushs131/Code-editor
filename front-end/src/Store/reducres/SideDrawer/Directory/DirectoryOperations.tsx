import IDirectory from "../../../../@types/directory.d";
import { IFilesInforation } from "../../../../@types/file.d";
import { IIcon } from "../../../../@types/Icon.d";
import {
  removeFromFilesInformationDirectoryIndexDB,
  storeToFilesInformationDirectoryIndexDB,
} from "../../../../library/idb/idb.lib";
import {
  directoryComparator,
  findFileExtension,
  findFileFolderIconUrl,
} from "../../../../utils/fileFolder.utils";


const traverseInDirectoryForAdd = (
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>,
  iconList: IIcon,
  info: {
    id: string;
    parentId: string;
    name: string;
    isFolder: boolean;
    path: Array<string>;
  },
  currDirPath: string = "root",
  pathIndx: number = 1
) => {
  if (
    info.path.length === pathIndx &&
    info.path[pathIndx - 1] === info.parentId
  ) {
    addFileOrFolder(filesInformation, directories, iconList, info, currDirPath);
    return true;
  }

  const childIndx = directories.findIndex(
    (directory) => directory.id === info.path[pathIndx]
  );

  if (childIndx === -1) return false;

  if (
    directories[childIndx].isFolder &&
    traverseInDirectoryForAdd(
      filesInformation,
      directories[childIndx].children,
      iconList,
      info,
      currDirPath + "/" + directories[childIndx].id,
      pathIndx + 1
    )
  )
    return true;

  return false;
};

const traverseInDirectoryForRename = (
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>,
  iconList: IIcon,
  info: {
    id: string;
    name: string;
    path: Array<string>;
  },
  pathIndx: number = 1
) => {
  const childIndx = directories.findIndex(
    (directory) => directory.id === info.path[pathIndx]
  );

  if (childIndx === -1) return false;

  if (info.path.length === pathIndx + 1) {
    renameOfFileOrFolder(
      filesInformation,
      directories,
      iconList,
      childIndx,
      info
    );
    return true;
  }

  if (
    directories[childIndx].isFolder &&
    traverseInDirectoryForRename(
      filesInformation,
      directories[childIndx].children,
      iconList,
      info,
      pathIndx + 1
    )
  )
    return true;

  // if the path is not found then return false
  return false;
};


const traverseInDirectoryForDelete = (
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>,
  id: string,
  path: Array<string>,
  pathIndx: number = 1
) => {

  const childIndx = directories.findIndex((directory) => {
    return directory.id === path[pathIndx];
  });

  
  if (childIndx === -1) return false;

  
  if (path.length === pathIndx + 1 && path[pathIndx] === id) {
    if (directories[childIndx].id === id) {
      if (directories[childIndx].isFolder) {
        deleteAllChildFiles(filesInformation, directories[childIndx].children);
      } else {
        removeFromFilesInformationDirectoryIndexDB(directories[childIndx].id);
        delete filesInformation[directories[childIndx].id];
      }
      directories.splice(childIndx, 1);
      return true;
    } else return false;
  }

  
  if (
    directories[childIndx].isFolder &&
    traverseInDirectoryForDelete(
      filesInformation,
      directories[childIndx].children,
      id,
      path,
      pathIndx + 1
    )
  )
    return true;

  
  return false;
};


function deleteAllChildFiles(
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>
) {
  for (const directory of directories) {
    if (directory.isFolder) {
      deleteAllChildFiles(filesInformation, directory.children);
    } else {
      // removing the files
      removeFromFilesInformationDirectoryIndexDB(directory.id);
      delete filesInformation[directory.id];
    }
  }
}


function renameOfFileOrFolder(
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>,
  iconList: IIcon,
  directoryIndx: number,
  info: {
    id: string;
    name: string;
  }
) {

  const newIconUrl = findFileFolderIconUrl(
    info.name,
    directories[directoryIndx].isFolder,
    iconList
  );
  directories[directoryIndx] = {
    ...directories[directoryIndx],
    name: info.name,
    iconUrls: newIconUrl,
  };

  if (!directories[directoryIndx].isFolder) {
    filesInformation[info.id] = {
      ...filesInformation[info.id],
      name: info.name,
      iconUrls: newIconUrl,
      language: findFileExtension(info.name).extName,
    };
    storeToFilesInformationDirectoryIndexDB(info.id, filesInformation[info.id]);
  }

  directories.sort(directoryComparator);
}


function addFileOrFolder(
  filesInformation: IFilesInforation,
  directories: Array<IDirectory>,
  iconList: IIcon,
  info: {
    id: string;
    parentId: string;
    name: string;
    isFolder: boolean;
  },
  path: string
) {
  const newItem = {
    id: info.id,
    parentId: info.parentId,
    name: info.name.trim(),
    iconUrls: findFileFolderIconUrl(info.name, info.isFolder, iconList),
    isFolder: info.isFolder,
    children: [],
    path: path + "/" + info.id,
  };

  directories.unshift(newItem);

  if (!info.isFolder) {
    filesInformation[info.id] = {
      id: info.id,
      name: newItem.name,
      iconUrls: newItem.iconUrls,
      body: "",
      language: findFileExtension(newItem.name).extName,
    };
    storeToFilesInformationDirectoryIndexDB(info.id, filesInformation[info.id]);
  }

  directories.sort(directoryComparator);
}

export {
  traverseInDirectoryForAdd,
  traverseInDirectoryForRename,
  traverseInDirectoryForDelete,
};
