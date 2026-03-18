from dataclasses import dataclass, field

_OPEN_TAGS = ("<think>", "<thinking>")
_CLOSE_TAGS = ("</think>", "</thinking>")


def _find_earliest_tag(text: str, tags: tuple[str, ...]) -> tuple[int, str] | None:
    lower_text = text.lower()
    best_index = -1
    best_tag = ""

    for tag in tags:
        idx = lower_text.find(tag)
        if idx == -1:
            continue
        if best_index == -1 or idx < best_index:
            best_index = idx
            best_tag = tag

    if best_index == -1:
        return None
    return best_index, best_tag


def _overlap_suffix_len(text: str, tags: tuple[str, ...]) -> int:
    lower_text = text.lower()
    max_overlap = 0

    for tag in tags:
        for overlap in range(1, len(tag)):
            if lower_text.endswith(tag[:overlap]) and overlap > max_overlap:
                max_overlap = overlap

    return max_overlap


@dataclass
class ThinkingFilterResult:
    visible_tokens: list[str] = field(default_factory=list)
    thinking_started: bool = False
    thinking_ended: bool = False


class ThinkingStreamFilter:
    """Strip <think>/<thinking> blocks from streamed text chunks.

    Handles tags split across chunks and reports transitions so callers can
    emit dedicated UI events (thinking_start / thinking_end).
    """

    def __init__(self) -> None:
        self._pending = ""
        self._in_thinking = False

    def consume(self, chunk: str) -> ThinkingFilterResult:
        result = ThinkingFilterResult()
        self._pending += chunk

        while True:
            if self._in_thinking:
                found_close = _find_earliest_tag(self._pending, _CLOSE_TAGS)
                if found_close is None:
                    overlap = _overlap_suffix_len(self._pending, _CLOSE_TAGS)
                    self._pending = self._pending[-overlap:] if overlap else ""
                    return result

                close_idx, close_tag = found_close
                self._pending = self._pending[close_idx + len(close_tag) :]
                self._in_thinking = False
                result.thinking_ended = True
                continue

            found_open = _find_earliest_tag(self._pending, _OPEN_TAGS)
            if found_open is None:
                overlap = _overlap_suffix_len(self._pending, _OPEN_TAGS)
                if overlap:
                    visible = self._pending[:-overlap]
                    self._pending = self._pending[-overlap:]
                else:
                    visible = self._pending
                    self._pending = ""

                if visible:
                    result.visible_tokens.append(visible)
                return result

            open_idx, open_tag = found_open
            if open_idx > 0:
                result.visible_tokens.append(self._pending[:open_idx])

            self._pending = self._pending[open_idx + len(open_tag) :]
            self._in_thinking = True
            result.thinking_started = True

    def finalize(self) -> ThinkingFilterResult:
        result = ThinkingFilterResult()

        if self._in_thinking:
            self._in_thinking = False
            self._pending = ""
            result.thinking_ended = True
            return result

        if self._pending:
            result.visible_tokens.append(self._pending)
            self._pending = ""

        return result
