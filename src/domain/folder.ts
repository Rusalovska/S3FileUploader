export interface FolderEntity {
  id: string;
  ownerId: string;
  parentId: string | null;
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderInput {
  ownerId: string;
  parentId?: string | null;
  name: string;
}