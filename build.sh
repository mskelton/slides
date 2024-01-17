#!/usr/bin/env bash

for filename in slides/*.md; do
	dir=$(basename "${filename%.*}")
	pnpm slidev build "$filename" --out "dist/$dir" --base "/$dir"
done
