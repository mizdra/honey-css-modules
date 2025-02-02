import { getCssModuleFileName, isComponentFileName } from 'honey-css-modules-core';
import type ts from 'typescript';

export const createCssModuleFileRefactor = {
  name: 'Create CSS Module file',
  description: 'Create CSS Module file',
  actions: [{ name: 'Create CSS Module file', description: 'Create CSS Module file for current file' }],
} as const satisfies ts.ApplicableRefactorInfo;

export function getApplicableRefactors(
  languageService: ts.LanguageService,
  project: ts.server.Project,
): ts.LanguageService['getApplicableRefactors'] {
  return (fileName, positionOrRange, preferences) => {
    const prior = languageService.getApplicableRefactors(fileName, positionOrRange, preferences) ?? [];
    if (isComponentFileName(fileName)) {
      // If the CSS Module file does not exist, provide a refactor to create it.
      if (!project.fileExists(getCssModuleFileName(fileName))) {
        prior.push(createCssModuleFileRefactor);
      }
    }
    return prior;
  };
}

export function getEditsForRefactor(languageService: ts.LanguageService): ts.LanguageService['getEditsForRefactor'] {
  // eslint-disable-next-line max-params
  return (fileName, formatOptions, positionOrRange, refactorName, actionName, preferences) => {
    const prior = languageService.getEditsForRefactor(
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences,
    ) ?? { edits: [] };
    if (isComponentFileName(fileName)) {
      if (refactorName === createCssModuleFileRefactor.name) {
        prior.edits.push(createNewCssModuleFileChange(getCssModuleFileName(fileName)));
      }
    }
    return prior;
  };
}

function createNewCssModuleFileChange(cssFilename: string): ts.FileTextChanges {
  return {
    fileName: cssFilename,
    textChanges: [{ span: { start: 0, length: 0 }, newText: '' }],
    isNewFile: true,
  };
}
