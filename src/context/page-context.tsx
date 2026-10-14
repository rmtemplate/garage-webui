import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Crumb = { label: string; to?: string };

type PageContextValues = {
  title: string | null;
  description: string | null;
  /** Rendered in the header, before the title. */
  breadcrumbs: Crumb[] | null;
  /** Back-arrow target. */
  prev: string | null;
  actions: React.ReactNode | null;
};

export const PageContext = createContext<
  | (PageContextValues & {
      setValue: (values: Partial<PageContextValues>) => void;
    })
  | null
>(null);

const initialValues: PageContextValues = {
  title: null,
  description: null,
  breadcrumbs: null,
  prev: null,
  actions: null,
};

export const PageContextProvider = ({ children }: PropsWithChildren) => {
  const [values, setValues] = useState<PageContextValues>(initialValues);

  const setValue = useCallback((value: Partial<PageContextValues>) => {
    setValues((prev) => ({ ...prev, ...value }));
  }, []);

  return (
    <PageContext.Provider value={{ ...values, setValue }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageContext = () => {
  const ctx = useContext(PageContext);
  if (!ctx) {
    throw new Error("usePageContext must be used within a PageContextProvider");
  }
  return ctx;
};

type PageProps = Partial<PageContextValues>;

/**
 * Declares the current page's header. Rendered as a child of each route, so
 * the header lives in the layout while the content owns what goes in it.
 *
 * `actions` is a fresh React element on every render, so the effect is keyed
 * on the serialisable fields instead of the props object — otherwise setting
 * context state would re-render the page and re-fire the effect forever.
 */
const Page = (props: PageProps) => {
  const { setValue } = usePageContext();
  const latest = useRef(props);
  latest.current = props;

  const key = JSON.stringify([
    props.title,
    props.description,
    props.breadcrumbs,
    props.prev,
    props.actions != null,
  ]);

  useEffect(() => {
    setValue({ ...initialValues, ...latest.current });
    return () => setValue(initialValues);
  }, [key, setValue]);

  return null;
};

export default Page;
