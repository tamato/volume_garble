#!/bin/bash

source_dir=~/programming/volume
build_dir=~/programming/volume_build
out_data=$build_dir/data
target=$build_dir/volume
local_target=./volume


if [[ $1 = "rebuild" ]]; then
    cd $build_dir
    rm -rf ./* && cmake -G "Sublime Text 2 - Unix Makefiles" $source_dir && make && $local_target
fi

if [[ $1 = "make" ]]; then
    cp $(find $source_dir -iname "*.vert") $out_data
    cp $(find $source_dir -iname "*.frag") $out_data

    cd $build_dir
    make && $local_target
fi

if [[ $1 = "run" ]]; then
    cp $(find $source_dir -iname "*.vert") $out_data
    cp $(find $source_dir -iname "*.frag") $out_data

    cd $build_dir
    $local_target
fi

if [[ $1 = "debug" ]]; then
    cd $build_dir
    gdb $local_target
fi

