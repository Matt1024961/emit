import { FileText, Wrench } from "lucide-react";
import { type FormEvent, useState } from "react";
import { COMPRESSOR_MODEL_GROUPS } from "@/catalog/compressor-models";
import { ENGINE_TYPES } from "@/catalog/engine-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWizardStore } from "@/store/wizard";
import { SetupHero } from "./setup-hero";
import { hasSetupErrors, type SetupErrors, validateSetup } from "./setup-validation";

/** Inline field error message, linked to its control via id for screen readers. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-destructive text-sm">
      {message}
    </p>
  );
}

/**
 * Step 1 — Panel Setup. The required fields surface custom, per-field
 * validation messages once the user tries to continue, then clear live as
 * each field is fixed. Submitting is wired to the footer "Continue" button
 * via `form="setup-form"`.
 */
export function SetupStep() {
  const wizard = useWizardStore();
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof SetupErrors, boolean>>>({});

  const errors = validateSetup({
    configName: wizard.configName,
    equipment: wizard.equipment,
  });

  // A field's message is revealed once it has been blurred (touched) or the
  // form has been submitted — then it updates live as the field is fixed.
  function show(key: keyof SetupErrors): string | undefined {
    return submitted || touched[key] ? errors[key] : undefined;
  }
  function markTouched(key: keyof SetupErrors) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasSetupErrors(errors)) {
      setSubmitted(true);
      return;
    }
    wizard.setStep(2);
  }

  return (
    <div className="space-y-4">
      <SetupHero />

      <form
        id="setup-form"
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto max-w-4xl space-y-3"
      >
        <div>
          <p className="emit-eyebrow text-primary text-xs">Step 1</p>
          <h2 className="text-foreground mt-1 text-lg font-bold tracking-wide uppercase">
            Panel Setup
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Name this configuration and enter the compressor equipment details.
          </p>
        </div>

        {/* items-stretch (the grid default) makes both cards equal height side by side. */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>
                <FileText className="text-muted-foreground size-4" />
                Configuration
              </CardTitle>
              <CardDescription>Give this panel configuration a unique name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="cfg-name">
                  Configuration name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cfg-name"
                  name="configName"
                  value={wizard.configName}
                  onChange={(e) => wizard.setConfigName(e.target.value)}
                  onBlur={() => markTouched("configName")}
                  placeholder="e.g. Kodiak Site 14 — JGC4 Recommended"
                  aria-invalid={Boolean(show("configName"))}
                  aria-describedby={show("configName") ? "cfg-name-error" : undefined}
                />
                <FieldError id="cfg-name-error" message={show("configName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cfg-desc">Description</Label>
                <Textarea
                  id="cfg-desc"
                  name="configDescription"
                  value={wizard.configDescription}
                  onChange={(e) => wizard.setConfigDescription(e.target.value)}
                  placeholder="Any notes about this configuration…"
                  rows={2}
                />
                <p className="text-muted-foreground text-xs">
                  Optional notes about this configuration.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Wrench className="text-muted-foreground size-4" />
                Equipment
              </CardTitle>
              <CardDescription>Specify the compressor and engine hardware.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="compressor-model">
                  Compressor model <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="compressorModel"
                  value={wizard.equipment.compressorModel}
                  onValueChange={(v) => wizard.setEquipment({ compressorModel: v })}
                >
                  <SelectTrigger
                    id="compressor-model"
                    className="w-full"
                    onBlur={() => markTouched("compressorModel")}
                    aria-invalid={Boolean(show("compressorModel"))}
                    aria-describedby={
                      show("compressorModel") ? "compressor-model-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select a compressor model…" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPRESSOR_MODEL_GROUPS.map((group) => (
                      <SelectGroup key={group.series}>
                        <SelectLabel>{group.series}</SelectLabel>
                        {group.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="compressor-model-error" message={show("compressorModel")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="engine-type">
                  Engine type <span className="text-destructive">*</span>
                </Label>
                <Select
                  name="engineType"
                  value={wizard.equipment.engineType}
                  onValueChange={(v) => wizard.setEquipment({ engineType: v })}
                >
                  <SelectTrigger
                    id="engine-type"
                    className="w-full"
                    onBlur={() => markTouched("engineType")}
                    aria-invalid={Boolean(show("engineType"))}
                    aria-describedby={show("engineType") ? "engine-type-error" : undefined}
                  >
                    <SelectValue placeholder="Select an engine type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="engine-type-error" message={show("engineType")} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="stages">
                    Compressor stages <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stages"
                    name="stages"
                    type="number"
                    min={1}
                    max={6}
                    value={wizard.equipment.stages}
                    onChange={(e) => wizard.setEquipment({ stages: Number(e.target.value) })}
                    onBlur={() => markTouched("stages")}
                    aria-invalid={Boolean(show("stages"))}
                    aria-describedby={show("stages") ? "stages-error" : undefined}
                  />
                  <FieldError id="stages-error" message={show("stages")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cooler-sections">Cooler sections</Label>
                  <Input
                    id="cooler-sections"
                    name="coolerSections"
                    type="number"
                    min={0}
                    max={8}
                    value={wizard.equipment.coolerSections}
                    onChange={(e) =>
                      wizard.setEquipment({ coolerSections: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {submitted && hasSetupErrors(errors) && (
          <p className="text-destructive text-sm" role="alert">
            Please fix the highlighted fields to continue.
          </p>
        )}
      </form>
    </div>
  );
}
