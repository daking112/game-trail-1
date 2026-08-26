import m from "mithril";
import type { State } from "../../state/state.ts";
import type { CatalogReader } from "../../state/catalog.ts";
import {
  generateRandomBatch,
  randomizeCharacter,
  type RandomMode,
} from "../../state/random.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";

type LocalState = {
  mode: RandomMode;
  prompt: string;
  seed: string;
  batchCount: number;
  busy: boolean;
};

export const AdvancedTools: m.Component<
  { state: State; catalog: CatalogReader },
  LocalState
> = {
  oninit(vnode) {
    vnode.state.mode = "balanced";
    vnode.state.prompt = "";
    vnode.state.seed = "";
    vnode.state.batchCount = 10;
    vnode.state.busy = false;
  },
  view(vnode) {
    const { state, catalog } = vnode.attrs;
    const local = vnode.state;
    const seedValue = local.seed.trim() === "" ? undefined : Number(local.seed);
    const options = () => ({
      mode: local.mode,
      prompt: local.prompt,
      seed: Number.isFinite(seedValue) ? seedValue : undefined,
    });
    const handleRandomize = async () => {
      if (local.busy) return;
      local.busy = true;
      try {
        await randomizeCharacter(catalog, state, options());
      } finally {
        local.busy = false;
        m.redraw();
      }
    };
    const handleBatch = async () => {
      if (local.busy) return;
      local.busy = true;
      try {
        await generateRandomBatch(catalog, state, {
          ...options(),
          count: local.batchCount,
        });
      } finally {
        local.busy = false;
        m.redraw();
      }
    };
    const handleFileUpload = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        state.customUploadedImage = img;
        m.redraw();
      };
      img.src = URL.createObjectURL(file);
    };
    const handleZPosChange = (e: Event) => {
      const value = Number((e.target as HTMLInputElement).value);
      state.customImageZPos = Number.isFinite(value) ? value : 0;
      m.redraw();
    };
    const clearCustomImage = () => {
      state.customUploadedImage = null;
      state.customImageZPos = 0;
      const input = document.getElementById(
        "customFileInput",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      m.redraw();
    };
    return m(
      CollapsibleSection,
      { title: "Advanced Tools", defaultOpen: false },
      [
        m("div.field", [
          m("label.label", "LPC Random Design Lab"),
          m(
            "p.help",
            "The generator searches the real LPC catalog and chooses compatible assets for you. You do not pick individual parts.",
          ),
        ]),
        m("div.columns.is-multiline", [
          m("div.column.is-half", [
            m("label.label", "Design mode"),
            m("div.select.is-fullwidth", [
              m(
                "select",
                {
                  value: local.mode,
                  onchange: (e: Event) => {
                    local.mode = (e.target as HTMLSelectElement)
                      .value as RandomMode;
                  },
                },
                [
                  ["balanced", "Balanced"],
                  ["chaos", "Chaos"],
                  ["human", "Human"],
                  ["creature", "Creature"],
                  ["monster", "Monster"],
                  ["warrior", "Warrior"],
                  ["mage", "Mage"],
                  ["ranger", "Ranger"],
                  ["forest", "Forest"],
                ].map(([value, label]) => m("option", { value }, label)),
              ),
            ]),
          ]),
          m("div.column.is-half", [
            m("label.label", "Seed (optional)"),
            m("input.input", {
              value: local.seed,
              type: "number",
              placeholder: "Random",
              oninput: (e: Event) => {
                local.seed = (e.target as HTMLInputElement).value;
              },
            }),
          ]),
        ]),
        m("div.field", [
          m("label.label", "Design brief (optional)"),
          m("textarea.textarea", {
            value: local.prompt,
            rows: 2,
            placeholder:
              "e.g. creepy swamp creature with horns, wings and lots of armor",
            oninput: (e: Event) => {
              local.prompt = (e.target as HTMLTextAreaElement).value;
            },
          }),
          m(
            "p.help",
            "Words in the brief influence which LPC assets are favored. You never have to select the parts.",
          ),
        ]),
        m("div.buttons", [
          m(
            "button.button.is-primary",
            { disabled: local.busy, onclick: handleRandomize },
            local.busy ? "Generating…" : "🎲 Generate 1",
          ),
        ]),
        m("hr"),
        m("div.field", [
          m("label.label", "Batch generator"),
          m("div.field.has-addons", [
            m("p.control", [
              m("input.input", {
                type: "number",
                min: 1,
                max: 100,
                value: local.batchCount,
                oninput: (e: Event) => {
                  local.batchCount = Math.max(
                    1,
                    Math.min(
                      100,
                      Number((e.target as HTMLInputElement).value) || 1,
                    ),
                  );
                },
              }),
            ]),
            m("p.control", [
              m(
                "button.button.is-info",
                { disabled: local.busy, onclick: handleBatch },
                `📦 Generate ${local.batchCount} + ZIP`,
              ),
            ]),
          ]),
          m(
            "p.help",
            "Exports PNG spritesheets, JSON selections, a manifest, and combined credits in one ZIP.",
          ),
        ]),
        m("hr"),
        m("div.field", [
          m("label.label", "Custom File Upload"),
          m("input.input[type=file]#customFileInput", {
            accept: "image/*",
            onchange: handleFileUpload,
          }),
          m("p.help", "Upload a local image to overlay on the spritesheet."),
        ]),
        m("div.field", [
          m("label.label", "Z-Position"),
          m("input.input[type=number]", {
            value: state.customImageZPos,
            oninput: handleZPosChange,
            placeholder: "0",
          }),
          m("p.help", [
            "Layer order: ",
            m("code", "0=shadow"),
            ", ",
            m("code", "10=body"),
            ", ",
            m("code", "70=arms"),
            ", ",
            m("code", "110=beard"),
          ]),
        ]),
        state.customUploadedImage &&
          m("div.field", [
            m(
              "button.button.is-small.is-warning",
              { onclick: clearCustomImage },
              "Clear Custom Image",
            ),
          ]),
      ],
    );
  },
};
