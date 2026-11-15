import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { combineQueries, type QueryLike } from '../utils/queryAggregator';

describe('queryAggregator - combineQueries', () => {
  it('returns default false states and no-op refetch when empty or all null/undefined', async () => {
    const emptyResult = combineQueries();
    assert.equal(emptyResult.isLoading, false);
    assert.equal(emptyResult.isError, false);
    assert.equal(emptyResult.isFetching, false);
    await assert.doesNotReject(emptyResult.refetch());

    const nullishResult = combineQueries(null, undefined, null);
    assert.equal(nullishResult.isLoading, false);
    assert.equal(nullishResult.isError, false);
    assert.equal(nullishResult.isFetching, false);
    await assert.doesNotReject(nullishResult.refetch());
  });

  it('aggregates isLoading flag when any query is loading', () => {
    const q1: QueryLike = { isLoading: false, isError: false };
    const q2: QueryLike = { isLoading: true, isError: false };
    const q3: QueryLike = { isLoading: false, isError: false };

    const result = combineQueries(q1, q2, q3);
    assert.equal(result.isLoading, true);
    assert.equal(result.isError, false);
  });

  it('aggregates isError flag when any query has error', () => {
    const q1: QueryLike = { isLoading: false, isError: false };
    const q2: QueryLike = { isLoading: false, isError: true };

    const result = combineQueries(q1, q2);
    assert.equal(result.isLoading, false);
    assert.equal(result.isError, true);
  });

  it('aggregates isFetching flag when any query is fetching', () => {
    const q1: QueryLike = { isFetching: false };
    const q2: QueryLike = { isFetching: true };

    const result = combineQueries(q1, q2);
    assert.equal(result.isFetching, true);
  });

  it('resolves false for all flags when all queries succeed without loading/error', () => {
    const q1: QueryLike = { isLoading: false, isError: false, isFetching: false };
    const q2: QueryLike = { isLoading: false, isError: false, isFetching: false };

    const result = combineQueries(q1, q2);
    assert.equal(result.isLoading, false);
    assert.equal(result.isError, false);
    assert.equal(result.isFetching, false);
  });

  it('executes refetch on all provided queries concurrently', async () => {
    let q1Refetched = false;
    let q2Refetched = false;

    const q1: QueryLike = {
      isLoading: false,
      refetch: async () => {
        q1Refetched = true;
      },
    };
    const q2: QueryLike = {
      isLoading: false,
      refetch: () => {
        q2Refetched = true;
      },
    };
    const q3WithoutRefetch: QueryLike = {
      isLoading: false,
    };

    const combined = combineQueries(q1, q2, q3WithoutRefetch, null);
    await combined.refetch();

    assert.equal(q1Refetched, true);
    assert.equal(q2Refetched, true);
  });
});
