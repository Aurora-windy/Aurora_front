export interface BuilderModuleResp {
  id: string
  name: string
  category: string
  description: string
  dependencies: string[]
  features: string[]
  status: string
  required: boolean
}

export interface BuilderParseReq {
  requirement: string
}

export interface BuilderGeneratePreviewReq {
  requirement: string
  moduleIds: string[]
}

export interface BuilderPlanResp {
  requestId: string
  requirement: string
  selectedModules: BuilderModuleResp[]
  excludedModules: string[]
  missingDependencies: string[]
  warnings: string[]
  nextStep: string
}

export interface BuilderGeneratedFileResp {
  path: string
  type: string
  description: string
  sizeBytes: number
}

export interface BuilderGeneratePreviewResp {
  buildId: string
  requirement: string
  selectedModules: string[]
  generatedFiles: BuilderGeneratedFileResp[]
  warnings: string[]
  nextStep: string
}
