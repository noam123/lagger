#!/bin/bash
default_namespace=default
defualt_kubeconfig="/Users/noamdoron/.kube/config"

function pause(){
   read -p "$*"
}

# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
        echo "Recieved CTRL-C"
        PGID=$(ps opgid= "$!")
        kill -9 --$PGID
}

function executeInNewTab(){
   execution=$*
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

function initGetPodsCommand(){
	if [ -z "$sshGetPodsCommand" ]; then
      getPodsCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace get pods $1"
   else
      getPodsCommand=`printf "$sshGetPodsCommand" "$1"`
   fi
}

COMMAND=$1
shift
namespace=$1
shift
serviceName=$1
shift

remaining_arg_line=$*

if [ -z "$COMMAND" -a "$COMMAND" != " " ]; then
	echo "ERROR: Please supply command"
	pause "Press something to continue ..."
	exit 1
fi


case "$namespace" in
   "prod" | "default")
      namespace="default"
      kubeconfig="/Users/noamdoron/.kube/config"
      ;;
   *)
      if [ -z "$namespace" -a "$namespace" != " " ]; then
         namespace=$default_namespace
         kubeconfig=$defualt_kubeconfig
         echo "Using default config file" $kubeconfig "for default namespace" $namespace
      else
         echo "ERROR: namespace" $namespace "is not configured"
         pause "Press something to continue ..."
         exit 1
      fi
      ;;
esac

#echo "Using namespace:" $namespace
#echo "Using configfile:" $kubeconfig
PGID_ARRAY=()
PID=0
case "$COMMAND" in
   "logs")
   echo "Retrieving pods ..."
   initGetPodsCommand
   #eval $getPodsCommand | grep $serviceName | while read -r service
   services=$(eval $getPodsCommand | grep $serviceName)
   echo "services:$services"
   while read -r service
   do
     echo "service:$service"
      while [ "$1" != "" ]; do
       case "$1" in
         "--filter")
            shift # shift argKey first
            filter=$1
            ;;
         "--tail")
            shift
            lines=$1
          ;;
          "-p")
            shift
            performanceMsGapThreshold=$1
          ;;
          "-c" | "--consolidate-output")
            consolidateOutput=$1
          ;;
         *)
           ;;
          esac

      shift # second shift for next argKey (argKey argValue)
      done

      #Defult lines
      if [ -z "$lines" ]; then
         lines=100
      fi

      service=$(echo $service | awk '{print $1;}')

      if [ -z "$sshLogsCommand" ]; then
        kubeCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace logs -f --tail=$lines $* $service"
      else
        kubeCommand=`printf "$sshLogsCommand" "$lines" "$service"`
      fi

      if [ -z "$performanceMsGapThreshold" ]; then
        laggerCommand="lagger"
      else
      	laggerCommand="lagger --performance-threshold=$performanceMsGapThreshold"
      	if [[ ! -z "$filter" ]]; then
        	 PerformanceFilter="|Performance Threshold Hit"
	       fi
      fi

      kubeCommand="$kubeCommand | $laggerCommand | grep --color=never -E '$filter$PerformanceFilter'"
      echo "kubeCommand = $kubeCommand"
      if [ -z "$consolidateOutput" ]; then
        executeInNewTab $kubeCommand
      else
        eval $kubeCommand &

        echo "Waiting for pid $!"
        PID_ARRAY+=("$!")
      fi
   done <<< "$services"
    echo "pids:"
    #printf '%s\n' "${PID_ARRAY[@]}"
    for pid in "${PID_ARRAY[@]}"
    do
      echo "waiting on ${pid}"
      wait ${pid}
    done
   ;;
   "configmap")
	if [ -z "$sshCommand" ]; then
        kubectl --kubeconfig=$kubeconfig --namespace=$namespace edit configmap
    else
        eval "$sshCommand 'kubectl -n$sshNameSpace edit configmap'"
    fi
   ;;
   "deployment")
   kubectl --kubeconfig=$kubeconfig --namespace=$namespace get pods | grep $serviceName | while read -r service
   do
      service=$(echo $service | awk '{print $1;}' | grep -Eo "^[^-]*-[^-]*" | grep $serviceName)
      kubeCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace edit deployment $service"
      executeInNewTab $kubeCommand
      break;
   done
   ;;
   "exec")
	   kubectl --kubeconfig=$kubeconfig --namespace=$namespace get pods | grep $serviceName | while read -r service
	   do
	      service=$(echo $service | awk '{print $1;}')
	      kubeCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace exec -it $service sh"
	      executeInNewTab $kubeCommand
	      break;
	   done
   ;;
   "delete")

		initGetPodsCommand
		eval $getPodsCommand | grep $serviceName | while read -r service
	   do
	      service=$(echo $service | awk '{print $1;}')

	  	    if [ -z "$sshCommand" ]; then
	  	 	   kubectl --kubeconfig=$kubeconfig --namespace=$namespace delete pod $service
	   		else
	  		   eval "$sshCommand 'sudo kubectl -n$sshNameSpace delete pod $service'"
		   	fi
	   done
   ;;
   "pods")
		initGetPodsCommand "-w"
		eval $getPodsCommand
   ;;
   "describe")
     kubectl --kubeconfig=$kubeconfig --namespace=$namespace describe services #pods
   ;;
   "ns")
		kubectl --kubeconfig=$kubeconfig get ns
   ;;
   "help")
		echo "syntax: kube <command> <namespace> <service_name> <options>"
		echo "commands: logs, describe, pods, delete, deployment, configmap, exec"
   ;;
esac
