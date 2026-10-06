"use client";

import { InscricaoModal } from "./InscricaoModal";

interface InscricaoGlobalListenerProps {
  config: Record<string, any>;
}

export function InscricaoGlobalListener({ config }: InscricaoGlobalListenerProps) {
  return <InscricaoModal initialConfig={config} />;
}
