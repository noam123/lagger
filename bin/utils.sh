#!/bin/bash

echo "$@"
rest_of_args=${*: 3}
echo $2 $rest_of_args

case "$1" in
        js-cleanup)
            SOURCE_DIR=$2
            # Check if the source directory is provided
            if [ -z "$SOURCE_DIR" ]; then
              echo "Usage: $0 <source_directory>"
              exit 1
            fi

            # Find all .ts files and delete corresponding .js and .js.map files
            find "$SOURCE_DIR" -type f -name "*.ts" | while read -r ts_file; do
              base_name="${ts_file%.ts}"
              js_file="${base_name}.js"
              js_map_file="${base_name}.js.map"

              if [ -f "$js_file" ]; then
                echo "Deleting $js_file"
                rm "$js_file"
              fi

              if [ -f "$js_map_file" ]; then
                echo "Deleting $js_map_file"
                rm "$js_map_file"
              fi
            done
            ;;
        *)
            echo $"Usage: $0 {js-cleanup}"
            exit 1

esac







