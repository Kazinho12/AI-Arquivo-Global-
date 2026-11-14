import { useEffect, useState, type ReactNode } from "react";
import { coverRequest } from "./coverService";
import { publicCoverUrl, type CoverImage } from "./covers";
export function CoverFrame({
  src,
  image,
  alt = "",
  onError,
}: {
  src: string;
  image: Pick<CoverImage, "x" | "y" | "zoom">;
  alt?: string;
  onError?: () => void;
}) {
  return (
    <div className="custom-cover-frame">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={onError}
        style={{
          objectPosition: `${image.x}% ${image.y}%`,
          transform: `scale(${image.zoom})`,
        }}
      />
    </div>
  );
}
export function CustomCover({
  image,
  publicId,
  workId,
  ownerId,
  children,
}: {
  image?: CoverImage | null;
  publicId?: string;
  workId?: string;
  ownerId?: string;
  children: ReactNode;
}) {
  const [privateSrc, setPrivateSrc] = useState({ key: "", url: "" }),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true,
      url = "";
    setPrivateSrc({ key: "", url: "" });
    setFailed(false);
    if (image && !publicId && workId && ownerId)
      coverRequest(
        `/media/cover/private/${workId}/${image.assetId}`,
        { method: "GET" },
        ownerId,
      )
        .then(async (response) => {
          const blob = await response.blob();
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(blob.type) ||
            blob.size > 5242880
          )
            throw Error("Imagem inválida");
          if (active) {
            url = URL.createObjectURL(blob);
            setPrivateSrc({
              key: `${ownerId}/${workId}/${image.assetId}`,
              url,
            });
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [image?.assetId, publicId, workId, ownerId]);
  if (!image || failed) return <>{children}</>;
  const src = publicId
    ? publicCoverUrl(publicId, image.assetId)
    : privateSrc.key === `${ownerId}/${workId}/${image.assetId}`
      ? privateSrc.url
      : "";
  return src ? (
    <CoverFrame src={src} image={image} onError={() => setFailed(true)} />
  ) : (
    <>{children}</>
  );
}
