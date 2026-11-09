import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, ImageIcon, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { useAllChannels } from "@/features/channels/hooks/useChannels";
import type { Channel } from "@/features/channels/types";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { postsApi } from "../api/posts.api";
import { POST_TEXT_MAX, PROMPT_MAX, type PostPlatform, type PublishResult } from "../types";

const TONES = ["Friendly", "Professional", "Exciting", "Informative"];
const LANGUAGES = ["English", "Nepali"];

const selectClass =
  "h-9 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-primary";

const POST_PLATFORM_LABEL: Record<PostPlatform, string> = { facebook: "Facebook", instagram: "Instagram" };

function httpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function ResultRow({ result }: { result: PublishResult }) {
  const published = result.status === "published";
  return (
    <li className="flex items-start gap-3 py-2.5">
      {published ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
      )}
      <div className="min-w-0 flex-1 text-sm">
        <b>{result.channel_name ?? POST_PLATFORM_LABEL[result.platform]}</b>
        <span className="text-muted-foreground"> · {POST_PLATFORM_LABEL[result.platform]}</span>
        <p className={published ? "text-muted-foreground" : "text-destructive"}>
          {published ? "Published" : `Not published: ${result.error ?? "Meta refused the post."}`}
        </p>
      </div>
      {published && result.permalink_url && (
        <a
          href={result.permalink_url}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary underline"
        >
          View post <ExternalLink className="size-3.5" />
        </a>
      )}
    </li>
  );
}

export function CreatePostPage() {
  const { lists, isPending: channelsLoading, error: channelsError } = useAllChannels();
  const [prompt, setPrompt] = useState("");
  const [writeFor, setWriteFor] = useState<PostPlatform | "both">("both");
  const [tone, setTone] = useState(TONES[0]!);
  const [language, setLanguage] = useState(LANGUAGES[0]!);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [imageBroken, setImageBroken] = useState(false);

  const generate = useMutation({ mutationFn: postsApi.generate, onSuccess: setText });
  const publish = useMutation({ mutationFn: postsApi.publish });

  const channels: Channel[] = [...(lists.facebook ?? []), ...(lists.instagram ?? [])].filter(
    (channel) => channel.is_active,
  );
  const image = imageUrl.trim();
  const imageInvalid = image !== "" && !httpsUrl(image);
  const linkInvalid = link.trim() !== "" && !httpsUrl(link.trim());
  const hasImage = image !== "" && !imageInvalid;
  // Instagram can't publish text on its own.
  const chosen = channels.filter(
    (channel) => selected.includes(channel.id) && (channel.platform !== "instagram" || hasImage),
  );
  const chosenFacebook = chosen.some((channel) => channel.platform === "facebook");
  const canPublish = text.trim() !== "" && chosen.length > 0 && !imageInvalid && !linkInvalid && !publish.isPending;

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function write() {
    generate.mutate({
      prompt: prompt.trim(),
      ...(writeFor !== "both" && { platform: writeFor }),
      tone: tone.toLowerCase(),
      language,
    });
  }

  function send() {
    publish.mutate({
      channel_ids: chosen.map((channel) => channel.id),
      text: text.trim(),
      ...(hasImage && { image_url: image }),
      ...(chosenFacebook && link.trim() && { link: link.trim() }),
    });
  }

  const previewName = chosen[0]?.name ?? "Your page";
  const published = publish.data?.filter((result) => result.status === "published").length ?? 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6">
      <title>Create post</title>
      <div>
        <h1 className="text-2xl font-bold">Create post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let AI write a post, check and edit it, then publish it to your Facebook Pages and Instagram accounts.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <Card className="grid gap-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" /> 1. Write with AI
            </h2>
            <div className="grid gap-1.5">
              <Label htmlFor="post-prompt">What is the post about?</Label>
              <Textarea
                id="post-prompt"
                rows={3}
                maxLength={PROMPT_MAX}
                placeholder="For example: a new BSc Nursing batch starts on 1 December, seats are limited"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="post-for">Write for</Label>
                <select
                  id="post-for"
                  className={selectClass}
                  value={writeFor}
                  onChange={(event) => setWriteFor(event.target.value as PostPlatform | "both")}
                >
                  <option value="both">Facebook and Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="post-tone">Tone</Label>
                <select id="post-tone" className={selectClass} value={tone} onChange={(event) => setTone(event.target.value)}>
                  {TONES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="post-language">Language</Label>
                <select
                  id="post-language"
                  className={selectClass}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {LANGUAGES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            {generate.error && <Alert>{toApiError(generate.error).detail}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!prompt.trim() || generate.isPending} onClick={write}>
                <Sparkles /> {generate.isPending ? "Writing…" : text ? "Write again" : "Write with AI"}
              </Button>
              {generate.isPending && (
                <span className="text-xs text-muted-foreground">This can take up to 30 seconds.</span>
              )}
              {text && !generate.isPending && (
                <span className="text-xs text-muted-foreground">Writing again replaces your text.</span>
              )}
            </div>
          </Card>

          <Card className="grid gap-4">
            <h2 className="font-semibold">2. Check the post</h2>
            <div className="grid gap-1.5">
              <Label htmlFor="post-text">Post text</Label>
              <Textarea
                id="post-text"
                rows={8}
                maxLength={POST_TEXT_MAX}
                placeholder="Write the post yourself, or let AI write it above."
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <span className="text-right text-xs text-muted-foreground tabular-nums">
                {text.length} / {POST_TEXT_MAX}
              </span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="post-image">Image link (optional for Facebook, required for Instagram)</Label>
              <Input
                id="post-image"
                type="url"
                inputMode="url"
                placeholder="https://example.com/photo.jpg"
                aria-invalid={imageInvalid}
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                  setImageBroken(false);
                }}
              />
              <p className={cn("text-xs", imageInvalid ? "text-destructive" : "text-muted-foreground")}>
                {imageInvalid
                  ? "Use a public link that starts with https://."
                  : "Facebook and Instagram download the image from this link, so it must be public."}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="post-link">Link (optional, Facebook only)</Label>
              <Input
                id="post-link"
                type="url"
                inputMode="url"
                placeholder="https://nepaeducation.com/admissions"
                aria-invalid={linkInvalid}
                value={link}
                onChange={(event) => setLink(event.target.value)}
              />
              {linkInvalid && <p className="text-xs text-destructive">Use a link that starts with https://.</p>}
            </div>
          </Card>

          <Card className="grid gap-4">
            <h2 className="font-semibold">3. Choose where to publish</h2>
            {channelsLoading && <p className="text-sm text-muted-foreground">Loading your channels…</p>}
            {channelsError && <Alert>{toApiError(channelsError).detail}</Alert>}
            {!channelsLoading && channels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No Facebook Pages or Instagram accounts connected.{" "}
                <Link to="/channels" className="text-primary underline">
                  Connect one
                </Link>
                .
              </p>
            )}
            <ul className="grid gap-2">
              {channels.map((channel) => {
                const needsImage = channel.platform === "instagram" && !hasImage;
                return (
                  <li key={channel.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                        needsImage && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        disabled={needsImage}
                        checked={selected.includes(channel.id) && !needsImage}
                        onChange={() => toggle(channel.id)}
                      />
                      <PlatformIcon platform={channel.platform} className="size-8 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">{channel.name}</b>
                        <span className="text-xs text-muted-foreground">
                          {needsImage
                            ? "Add an image to post on Instagram"
                            : POST_PLATFORM_LABEL[channel.platform as PostPlatform]}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {publish.error && <Alert>{toApiError(publish.error).detail}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!canPublish} onClick={send}>
                {publish.isPending
                  ? "Publishing…"
                  : chosen.length === 0
                    ? "Publish"
                    : `Publish to ${chosen.length} ${chosen.length === 1 ? "channel" : "channels"}`}
              </Button>
              <span className="text-xs text-muted-foreground">Publishing makes the post public straight away.</span>
            </div>
            {publish.data && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-semibold">
                  Published to {published} of {publish.data.length}{" "}
                  {publish.data.length === 1 ? "channel" : "channels"}
                </p>
                <ul className="divide-y">
                  {publish.data.map((result) => (
                    <ResultRow key={result.channel_id} result={result} />
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <aside className="grid gap-2 lg:sticky lg:top-6" aria-label="Preview">
          <h2 className="text-sm font-semibold text-muted-foreground">Preview</h2>
          <article className="overflow-hidden rounded-xl border bg-background">
            <div className="flex items-center gap-3 p-3">
              <img src="/logo.png" alt="" className="size-9 rounded-full border object-contain" />
              <div>
                <b className="block text-sm">{previewName}</b>
                <span className="text-xs text-muted-foreground">Just now</span>
              </div>
            </div>
            <p
              className={cn(
                "px-3 pb-3 text-sm break-words whitespace-pre-wrap",
                !text && "text-muted-foreground italic",
              )}
            >
              {text || "Your post text appears here."}
            </p>
            {hasImage && !imageBroken ? (
              <img src={image} alt="" className="w-full bg-muted object-cover" onError={() => setImageBroken(true)} />
            ) : (
              <div className="grid aspect-square place-items-center bg-muted text-xs text-muted-foreground">
                <span className="grid justify-items-center gap-2 px-6 text-center">
                  <ImageIcon className="size-8" />
                  {imageBroken ? "This image link doesn't open. Check it's public." : "No image"}
                </span>
              </div>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}
