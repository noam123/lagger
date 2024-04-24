#!/bin/bash
export MSYS_NO_PATHCONV=1 #for gitbash on win, fixes  (InvalidParameterException) when calling the DescribeLogStreams operation: 1 validation error detected: Value 'C:/Program Files/Git/aws/lambda/funcname' at 'logGroupName' failed to satisfy constraint: Member must satisfy regular expression pattern: [\.\-_/#A-Za-z0-9]+

#export AWS_REGION=us-east-2

COMMAND=$1
shift
#AW_PROFILE=$1
PROFILE=$1
shift
LAMBDA_NAME=$1
shift

remaining_arg_line=$*

# TODO: debug /pas/adb-proxy/db2-jenkins-master log group logs (getting all undefined)

#declare -a profile_map=(["dev"]="adb_186093638438" ["prod"]="adb_348364229727")
#PROFILE="${profile_map[$AW_PROFILE]}"
#if [ -z "$PROFILE" ]; then
#    PROFILE="$AW_PROFILE"
#fi

echo "DEBUG: using aws profile $PROFILE x"

MINUTES=0

if [ -z "$COMMAND" -a "$COMMAND" != " " ]; then
	echo "ERROR: Please supply command"
	pause "Press something to continue ..."
	exit 1
fi

if [ -z "$PROFILE" -a "$PROFILE" != " " ]; then
	if [ -z "${AWS_PROFILE}" ]; then
		echo "Profile arg (AWS profile) is missing and couldn't find AWS_PROFILE environment variable"
    pause "Press something to continue ..."
    exit 1
	fi

  echo "Using AWS_PROFILE: ${AWS_PROFILE} environment variable"
  PROFILE=${AWS_PROFILE}
fi

function tailEventLogs() {
   while read -r LOG_STREAM_NAME
     do
       echo "DEBUG: LOG_STREAM_NAME: $LOG_STREAM_NAME"
       LOG_STREAM_NAME=${LOG_STREAM_NAME//[$'\t\r\n']}
       NORMALIZED_GROUP_NAME=$(echo "$LOG_STREAM_NAME" | cut -d'/' -f 4)
       echo "DEBUG: NORMALIZED_GROUP_NAME: $NORMALIZED_GROUP_NAME"

       TMP_TOKENS_FILE="aws-$NORMALIZED_GROUP_NAME-events.txt"
       #SERVICE_NAME=$(echo "$NORMALIZED_GROUP_NAME" | cut -d'-' -f 1)
       #STAGE=$(echo "$NORMALIZED_GROUP_NAME" | cut -d'-' -f 2)
       REAL_LAMBDA_NAME=$(echo "$NORMALIZED_GROUP_NAME" | cut -d'-' -f 3)
       #TMP_TOKENS_FILE="aws-$PROFILE-$LOG_STREAM_NAME-$LAMBDA_NAME-events.txt"

      # trap ctrl-c and call ctrl_c()
       trap ctrl_c INT
       watchEvenLogStreams $LOG_STREAM_NAME $START_TIME $TMP_TOKENS_FILE $REAL_LAMBDA_NAME &
       PID_ARRAY+=("$!")
       echo "$LOG_STREAM_NAME: waiting for logs (pid: $!)"

    done <<< "$LOG_GROUP_NAMES"


     for pid in "${PID_ARRAY[@]}"
      do
        echo "DEBUG: waiting on ${pid}"
        wait ${pid}
      done
}

function watchEvenLogStreams() {
    LOG_GROUP_NAME=$1
    START_TIME=$2
    TMP_TOKENS_FILE=$3
#    SERVICE_NAME=$4
#    STAGE=$5
    REAL_LAMBDA_NAME=$4

    echo "DEBUG: LOG_GROUP_NAME: $LOG_GROUP_NAME"
    echo "DEBUG: START_TIME: $START_TIME"
    echo "DEBUG: TMP_TOKENS_FILE: $TMP_TOKENS_FILE"
#    echo "DEBUG: SERVICE_NAME: $SERVICE_NAME"
#    echo "DEBUG: STAGE: $STAGE"
    echo "DEBUG: REAL_LAMBDA_NAME: $REAL_LAMBDA_NAME"

    while true; do
      #echo "aws --profile $PROFILE logs filter-log-events --log-group-name $LOG_GROUP_NAME --output text --start-time $START_TIME | lagger $necessary -t=$REAL_LAMBDA_NAME | grep --color=never -E $filter"
      aws --profile $PROFILE logs filter-log-events --log-group-name $LOG_GROUP_NAME --output text --start-time $START_TIME | tee $TMP_TOKENS_FILE | lagger $necessary -t=$REAL_LAMBDA_NAME "$necessary" | grep --color=never -E "$filter"
      NEXT_START_TIME=$(tac $TMP_TOKENS_FILE | grep -m 1 -E '^\t' | tr -d '[:space:]')
      #echo "NEXT_START_TIME: $NEXT_START_TIME"
      if [ ! -z ${NEXT_START_TIME+x} ] && [ "$NEXT_START_TIME" != "" ]; then
          #echo "Setting next time : $NEXT_START_TIME"
          NEXT_START_TIME=$((NEXT_START_TIME+1))
          #echo "after incr next time : $NEXT_START_TIME"
          START_TIME=$NEXT_START_TIME
      fi
      sleep 1
    done
}


function executeInNewTabWin(){
    execution=$*
#    if [ ! -z "$watch" ]; then
#          execution="export LAGGER_SILENT_FORMATTER_ERRORS=true && $watchFunctionString && watch $execution"
#    fi

  echo "$execution"
  sh.exe -c $execution -new_console
}

function executeInNewTab(){
    execution=$*
    if [ ! -z "$watch" ]; then
          execution="export LAGGER_SILENT_FORMATTER_ERRORS=true && $watchFunctionString && watch $execution"
    fi

  echo "$execution"

   # 57 - caps lock
   osascript <<EOF
      tell application "iTerm" to activate
      tell application "System Events" to tell process "iTerm" to keystroke "t" using command down
      tell application "System Events" to tell process "iTerm" to key code 57
      tell application "System Events" to tell process "iTerm" to keystroke "echo -ne '\\\033];$service\\\007' &"
      tell application "System Events" to tell process "iTerm" to keystroke "$execution"
      tell application "System Events" to tell process "iTerm" to key code 52
EOF
}

function ctrl_c() {
        echo "Recieved CTRL-C"
        for pid in "${PID_ARRAY[@]}"
        do
          echo "killing pid $pid"
          kill -9 $pid
          #PGID=$(ps opgid= "${pid}")
        done

        #kill -9 $PGID
         #if [ ! -z ${TMP_TOKENS_FILE+x} ] ; then
         #  rm -f $TMP_TOKENS_FILE
         #fi
}

function getLogGroups(){
  #echo "DEBUG: retrieving log group names..."
  log_groups=$(aws --profile $PROFILE logs describe-log-groups --output text --query logGroups[*].[logGroupName] | grep -i $LAMBDA_NAME)
  # TODO: if log_groups is empty terminate process
  echo "$log_groups"
}

case "$COMMAND" in
   "lgn")
      LOG_GROUP_NAMES=$(getLogGroups)
      echo "$LOG_GROUP_NAMES"
    ;;
   "logs")
      while [ "$1" != "" ]; do
       case "$1" in
         "--filter" | "-f")
            shift # shift argKey first
            filter=$1
            ;;
         "--tail")
            TAIL=$1
          ;;
          "-p")
            shift
            performanceMsGapThreshold=$1
            PerformanceFilter="|Performance Threshold Hit"
          ;;
          "-c" | "--consolidate-output")
            consolidateOutput=$1
          ;;
          "-w" | "--watch")
            watch=$1
          ;;
        "-m" | "--minutes")
            shift
            MINUTES=$1
         ;;
        "-n" | "--necessary")
            necessary=$1
         ;;
#        "-s" | "--sequence")
#            shift
#            echo $1
#            sequence=$1
#         ;;
         *)
           ;;
          esac

      shift # second shift for next argKey (argKey argValue)
      done

  START_TIME=$(gdate -d "$MINUTES minutes ago" +%s%N | cut -b1-13)
  echo "DEBUG: START_TIME: $START_TIME"
  SEQUENCE_FILE="$(dirname $BASH_SOURCE)/../resources/sequences/$LAMBDA_NAME"
  if [[ -f "$SEQUENCE_FILE" ]]; then
    echo "using sequence $SEQUENCE_FILE"
    LOG_GROUP_NAMES=`cat $SEQUENCE_FILE`
    echo "$value"
    tailEventLogs
    exit 0
  fi

  echo "Retrieving log group names..."
  # TODO: cache group names
  # TODO: get log groups by service name
   LOG_GROUP_NAMES=$(getLogGroups)
   if [[ $? != 0 || "$LOG_GROUP_NAMES" == " " ]]; then
        echo "Failed to retrieve log groups"
        exit 1
   fi

   echo "DEBUG: LOG_GROUP_NAMES: $LOG_GROUP_NAMES"
   # CAUTION: on mac 2024 you'll get -d illegal option, fix: brew install coreutils && add alias date=gdate to .bash_profile (any other profile file)
   #START_TIME=$(date -d "$MINUTES minutes ago" +%s%N | cut -b1-13)
   # gdate for mac terminal

  #LOG_SREAM_NAMES=$(aws --profile $PROFILE logs describe-log-streams --log-group-name /aws/lambda/application-layers-dev-getApplicationsLayerNames --output text --descending --max-items 1)
   #TMP_TOKENS_FILE="aws-$PROFILE-$LAMBDA_NAME-events.txt"

  #trap ctrl_c INT
  tailEventLogs

#  if [ ! -z ${watch} ]; then
#      tailEventLogs
#  fi


  #rm -f $TMP_TOKENS_FILE

#   while true
#   do
#      aws --profile default logs filter-log-events --log-group-name '/aws/lambda/idamService-noam-authorizerFunc' --output text --start-time '1592663192992'
#    echo "Retrieving log stream name..."
#     LOG_STREAM_NAME=$(aws --profile $PROFILE logs describe-log-streams --log-group-name $LOG_GROUP_NAME --output text --max-items 1 --order-by LastEventTime --descending --query logStreams[*].[logStreamName]  | head -n1 | awk '{print $1;}')
#     echo "LOG_STREAM_NAME: $LOG_STREAM_NAME"
#
#     if [ "$PREVIOUS_LOG_STREAM_NAME" == "$LOG_STREAM_NAME" ]; then
#         continue
#     fi
#
#     CURRENT_TOKEN="NEXT"
#
#     while [ "$NEXT_TOKEN" != "$CURRENT_TOKEN" ]
#     do
#      if [ ! -z ${NEXT_TOKEN+x} ]; then
#         # echo "in -z next token"
#          NEXT_TOKEN_ARG="--next-token $NEXT_TOKEN"
#      fi
#      echo "aws --profile $PROFILE logs get-log-events --log-group-name $LOG_GROUP_NAME --log-stream-name '$LOG_STREAM_NAME' $NEXT_TOKEN_ARG --output text --limit 500"
#      aws --profile $PROFILE logs get-log-events --log-group-name $LOG_GROUP_NAME --log-stream-name $LOG_STREAM_NAME $NEXT_TOKEN_ARG --output text --limit 500 | tee $TMP_TOKENS_FILE | lagger
#      CURRENT_TOKEN=$NEXT_TOKEN
#      NEXT_TOKEN=$(head -1 $TMP_TOKENS_FILE | awk '{print $2}')
#      echo "NEXT_TOKEN: $NEXT_TOKEN"
#      echo "CURRENT_TOKEN: $CURRENT_TOKEN"
#      sleep 1
#     done
#
#     echo "exited next token while loop"
#     PREVIOUS_LOG_STREAM_NAME=$LOG_STREAM_NAME
#     if [ -z ${TAIL+x} ]; then
#         echo "no tail option breaking.."
#         break
#     fi
#
#  done

#   echo "aws --profile $PROFILE logs get-log-events --log-group-name $LOG_GROUP_NAME --log-stream-name '$LOG_STREAM_NAME' --limit 500"
#   aws --profile $PROFILE logs get-log-events --log-group-name $LOG_GROUP_NAME --log-stream-name $LOG_STREAM_NAME --output text --limit 500 | tee $TMP_TOKENS_FILE | lagger #--start-time $START_TIME
#   NEXT_TOKEN=$(head -1 $TMP_TOKENS_FILE | awk '{print $2}')
#   echo $NEXT_TOKEN
#   aws --profile $PROFILE logs get-log-events --log-group-name $LOG_GROUP_NAME --log-stream-name $LOG_STREAM_NAME --next-token $NEXT_TOKEN --output text --limit 500 | tee $TMP_TOKENS_FILE | lagger
   ;;
   "help")
		echo "syntax: aw <command> <namespace> <lambda_name> <options>"
		echo "commands: logs"
   ;;
esac


#aws logs describe-log-groups --query logGroups[*].logGroupName
#aws logs describe-log-streams --log-group-name '/aws/lambda/ingest-manager-dev-acknowledgeMPUploadPart' --query logStreams[*].logStreamName
#aws logs get-log-events --log-group-name '/aws/lambda/MyFunction' --log-stream-name '2018/02/07/[$LATEST]140c61ffd59442b7b8405dc91d708fdc'

#aws logs get-log-events --log-group-name '/aws/lambda/ingest-manager-staging-acknowledgeMPUploadPart' --log-stream-name '2020/06/17/[$LATEST]ff8121b6bda543de88e0a2856987e93d' --profile staging


