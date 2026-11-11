import type { StudioWork } from "./types";
import type {
  DraftMetadata,
  WorksRepository,
  EditorialAction,
} from "./worksRepository";
export interface WorksState {
  works: StudioWork[];
  loading: boolean;
  saving: boolean;
  loaded: boolean;
  error: string;
}
export class WorksController {
  private state: WorksState = {
    works: [],
    loading: true,
    saving: false,
    loaded: false,
    error: "",
  };
  private listeners = new Set<() => void>();
  private generation = 0;
  private active = true;
  readonly editorBuffers = new Map<
    string,
    {
      work: StudioWork;
      title: string;
      content: string;
      alignment: "left" | "center";
    }
  >();
  constructor(private repository: WorksRepository) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private set(patch: Partial<WorksState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  stop = () => {
    this.active = false;
    this.editorBuffers.clear();
    this.generation++;
    this.state = {
      works: [],
      loading: true,
      saving: false,
      loaded: false,
      error: "",
    };
  };
  load = async () => {
    if (this.state.saving) return;
    this.active = true;
    const generation = ++this.generation;
    this.set({ loading: true, error: "" });
    try {
      const works = await this.repository.list();
      if (this.active && generation === this.generation)
        this.set({ works, loading: false, loaded: true });
    } catch (error) {
      if (this.active && generation === this.generation)
        this.set({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as obras.",
        });
    }
  };
  private async mutate<T>(
    operation: () => Promise<T>,
    apply: (result: T) => StudioWork[],
  ): Promise<T | null> {
    if (!this.active || this.state.saving) return null;
    const generation = ++this.generation;
    this.set({ saving: true, loading: false, error: "" });
    try {
      const result = await operation();
      if (!this.active || generation !== this.generation) return null;
      this.set({ works: apply(result), saving: false });
      return result;
    } catch (error) {
      if (this.active && generation === this.generation)
        this.set({
          saving: false,
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível guardar.",
        });
      return null;
    }
  }
  create = (metadata: DraftMetadata) =>
    this.mutate(
      () => this.repository.create(metadata),
      (work) => [work, ...this.state.works],
    );
  update = (work: StudioWork, metadata: DraftMetadata) =>
    this.mutate(
      () => this.repository.update(work, metadata),
      (saved) =>
        this.state.works.map((item) => (item.id === saved.id ? saved : item)),
    );
  private clearBuffers(workId: string, entries?: StudioWork["chapters"]) {
    for (const [id, buffer] of this.editorBuffers) {
      if (
        buffer.work.id === workId &&
        (!entries || !entries.some((entry) => entry.id === id))
      )
        this.editorBuffers.delete(id);
    }
  }
  editorial = (
    work: StudioWork,
    action: EditorialAction,
    payload: Record<string, unknown> = {},
  ) =>
    this.mutate(
      async () => {
        if (!this.repository.editorial)
          throw new Error(
            "A gestão editorial ainda não está disponível neste serviço.",
          );
        return this.repository.editorial(work, action, payload);
      },
      (result) => {
        if (result.deletedId) {
          this.clearBuffers(result.deletedId);
          return this.state.works.filter(
            (item) => item.id !== result.deletedId,
          );
        }
        if (!result.work) return this.state.works;
        const saved = result.work;
        this.clearBuffers(saved.id, saved.chapters);
        const found = this.state.works.some((item) => item.id === saved.id);
        return found
          ? this.state.works.map((item) =>
              item.id === saved.id ? saved : item,
            )
          : [saved, ...this.state.works];
      },
    );
  recover = (id: string) =>
    this.mutate(
      () => this.repository.find(id),
      (work) =>
        work
          ? this.state.works.map((item) => (item.id === id ? work : item))
          : this.state.works.filter((item) => item.id !== id),
    );
  remove = async (work: StudioWork) =>
    (await this.mutate(
      async () => {
        await this.repository.remove(work);
        this.clearBuffers(work.id);
        return true;
      },
      () => this.state.works.filter((item) => item.id !== work.id),
    )) === true;
}
