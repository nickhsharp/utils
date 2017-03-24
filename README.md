# Rationale

Many of these libs are tiny small utils that meet my use case exactly.  Some of them were havily inspired by existing libs, and in their comments I seek to keep that clarification.

Most of the time these were all very low level libraries that I wanted to understand, and writing it oneself is the best avenue towards that understanding.  I can now gladly say that at one point in time I did understand all the insane bitwise magics involed in uuid's... and then promprly forgot it.

## Libs

It's a big list, each of them is fairly well documented, and there are tests for all of them

## Principles

### No external dependencies

npms' jsonwebtoken for example brings in a very heavy set of code.  Most of which resolves around being "the jwt lib for all the cases".  Whereas I wanted a specific set of signature algorithms and only that set.

npm's uuid for example was just one that was almost like my ideal, straightforward, low to zero dependencies. I enjoyed re-writing it to actually learn how it ticks, and in so doing added a v1Sortable method and methods to extract the times from a v1.

