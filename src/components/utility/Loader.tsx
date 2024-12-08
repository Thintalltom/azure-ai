import loadingIcon from "@/assets/svG/loadingIcon.svg";

const Loader = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <img
        src={loadingIcon}
        alt="loading"
        className="w-[100px] h-[100px] loading-icon "
      />
    </div>
  );
};

export default Loader;
