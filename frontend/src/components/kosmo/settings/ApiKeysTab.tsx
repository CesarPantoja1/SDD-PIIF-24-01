import { Cpu } from "lucide-react";
import type { ProviderKey } from "@/lib/types";
import { PROVIDERS } from "@/lib/constants";
import { Card } from "@/components/kosmo/common";
import { useApiKeys } from "@/hooks/use-api-keys";
import { ProviderKeyCard } from "@/components/kosmo/settings/ProviderKeyCard";

export function ApiKeysTab() {
  const { keys, saveKey, deleteKey, testKey, revealKey } = useApiKeys();

  return (
    <div className="max-w-2xl">
      <Card>
        <h3 className="font-semibold flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-500" /> Proveedores de modelos
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra las API Keys de los proveedores. Solo los proveedores con clave podrán usarse al asignar agentes.
        </p>
        <div className="mt-5 space-y-4">
          {(Object.keys(PROVIDERS) as ProviderKey[]).map((provider) => (
            <ProviderKeyCard
              key={provider}
              provider={provider}
              savedKey={keys[provider] ?? ""}
              onSave={(key) => saveKey(provider, key)}
              onDelete={() => deleteKey(provider)}
              onTest={(key?) => testKey(provider, key)}
              onReveal={() => revealKey(provider)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
