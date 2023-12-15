export default function Switch({
  isChecked,
  onChange,
  text,
}: {
  isChecked: boolean;
  onChange: () => void;
  text: string;
}) {
  return (
    <div className="flex items-center mt-2">
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          id="switch"
          type="checkbox"
          checked={isChecked}
          className="peer sr-only"
          onClick={onChange}
        />
        <label htmlFor="switch" className="hidden"></label>
        <div className="peer h-6 w-11 rounded-full border bg-slate-200 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-green-300"></div>
      </label>

      <span
        className="ml-3 text-gray-900 text-sm cursor-default"
        onClick={onChange}
      >
        {text}
      </span>
    </div>
  );
}
