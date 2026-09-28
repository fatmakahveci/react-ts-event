import { useEffect, useState, type ImgHTMLAttributes } from "react";

export default function EventImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img {...props} src={failed || !src ? "/images/community-meetup.jpg" : src} alt={alt} decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
