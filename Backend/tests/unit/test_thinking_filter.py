from app.services.conversation.thinking_filter import ThinkingStreamFilter


def test_stream_filter_should_keep_plain_text_when_no_thinking_tags():
    f = ThinkingStreamFilter()

    r1 = f.consume("Hello ")
    r2 = f.consume("world")
    r3 = f.finalize()

    assert (
        "".join(r1.visible_tokens + r2.visible_tokens + r3.visible_tokens)
        == "Hello world"
    )
    assert not r1.thinking_started
    assert not r1.thinking_ended


def test_stream_filter_should_strip_thinking_block_and_emit_transitions():
    f = ThinkingStreamFilter()

    r = f.consume("Visible <thinking>hidden steps</thinking> final")
    end = f.finalize()

    assert "".join(r.visible_tokens + end.visible_tokens) == "Visible  final"
    assert r.thinking_started
    assert r.thinking_ended


def test_stream_filter_should_handle_tags_split_across_chunks():
    f = ThinkingStreamFilter()

    c1 = f.consume("Hello <thi")
    c2 = f.consume("nking>secret")
    c3 = f.consume(" chain</thinking> world")
    end = f.finalize()

    combined_visible = "".join(
        c1.visible_tokens + c2.visible_tokens + c3.visible_tokens + end.visible_tokens
    )

    assert combined_visible == "Hello  world"
    assert c2.thinking_started
    assert c3.thinking_ended


def test_stream_filter_should_close_thinking_on_finalize_if_unclosed():
    f = ThinkingStreamFilter()

    c1 = f.consume("<think>never closed")
    end = f.finalize()

    assert c1.thinking_started
    assert not c1.thinking_ended
    assert end.thinking_ended
    assert end.visible_tokens == []
