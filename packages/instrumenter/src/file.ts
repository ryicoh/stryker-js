import { FileDescription } from '@ryicoh/api/core';

export interface File extends FileDescription {
  name: string;
  content: string;
}
