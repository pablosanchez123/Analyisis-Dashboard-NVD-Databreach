from datetime import datetime

from ingestion.nvd_client import MAX_DATE_SPAN_DAYS, chunk_date_range


def test_chunk_date_range_respects_120_day_max():
    start = datetime(2019, 1, 1)
    end = datetime(2026, 7, 8)

    chunks = list(chunk_date_range(start, end))

    assert chunks[0][0] == start
    assert chunks[-1][1] == end
    for chunk_start, chunk_end in chunks:
        assert (chunk_end - chunk_start).days <= MAX_DATE_SPAN_DAYS

    # windows are contiguous, no gaps or overlaps
    for i in range(len(chunks) - 1):
        assert chunks[i][1] == chunks[i + 1][0]


def test_chunk_date_range_short_span_single_chunk():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 2, 1)

    chunks = list(chunk_date_range(start, end))

    assert len(chunks) == 1
    assert chunks[0] == (start, end)
