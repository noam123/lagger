#!/bin/bash
default_namespace=default
defualt_kubeconfig="/Users/noamdoron/.kube/config"

function pause(){
   read -p "$*"
}

function ctrl_c() {
        #echo "Recieved CTRL-C"
        for pid in "${PID_ARRAY[@]}"
        do
          PGID=$(ps opgid= "${pid}")
        done
        kill -9 -$PGID
}

function watch() {
      command=$*
      echo "command: $command"
      while :;
        do
           watch_result=$(eval $command)
           if [[ $? -eq 0 ]]; then
              break;
           fi
           clear
           sleep 1
       done
}

watchFunctionString="function watch() {
      command=\$*
      echo 'command: \$command'
      while :;
        do
           eval \$command
           if [[ \$? -eq 0 ]]; then
              break;
           fi
           clear
           sleep 1
       done
}"

cntrlCFunctionString="ctrl_c() {
                echo ''cntrl c received'';
                kill -9 \$\$;
           }"

pollContainersFunctionString="${cntrlCFunctionString} && function pollContainers() {
            echo \$1;
            pwd;
            trap ctrl_c INT;

            while :;
            do

              services=\$(docker ps | grep -v ''\$1'');
               if [[ -z ''\$services'' ]]; then
                       echo ''No containers found for query: \$1'';
                       exit 1;
              fi;

               while read -r service;
                do\n

                    read containerId service _ <<< \$service;

                     if [[ '' \${CONTAINER_IDS[@]} '' =~ '' \${containerId} '' ]]; then
                        continue;
                    fi;

                    echo ''Start logging container: \$containerId \$service'';

                    CONTAINER_IDS+=(''\$containerId'');

                    docker logs --tail=100 -f \$containerId &

                done <<< ''\$services'';
                sleep 1;
            done
            }"


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

function initGetPodsCommand(){
	if [ -z "$sshGetPodsCommand" ]; then
      getPodsCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace get pods $1"
   else
      getPodsCommand=`printf "$sshGetPodsCommand" "$1"`
   fi
}

function is_services_defined() {
    if [ -z "$services" ] || [ "$services" -eq "" ]; then
       echo "No pods found for query: $serviceName
configmap: $kubeconfig
namespace: $namespace"
       exit 1
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
      kubeconfig="/Users/noamdoron/.kube/config_codefresh"
      ;;
    "cluster-ent-2.cf-cd.com")
      namespace="workflow"
      kubeconfig="/Users/noamdoron/.kube/config_cluster-ent-2.cf-cd.com"
      ;;
    "rc05.cf-cd.com")
      namespace="workflow"
      kubeconfig="/Users/noamdoron/.kube/config_rc05.cf-cd.com"
      ;;
    "rc04.cf-cd.com")
      namespace="workflow"
      kubeconfig="/Users/noamdoron/.kube/config_rc04.cf-cd.com"
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

case "$COMMAND" in
   "logs")
   echo "Retrieving pods ..."
   initGetPodsCommand
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
            PerformanceFilter="|Performance Threshold Hit"
          ;;
          "-c" | "--consolidate-output")
            consolidateOutput=$1
          ;;
          "-w" | "--watch")
            watch=$1
          ;;
         *)
           ;;
          esac

      shift # second shift for next argKey (argKey argValue)
      done

  if [ -z "$watch" ]; then
         services=$(eval $getPodsCommand | grep $serviceName)
        else
          watch "$getPodsCommand | grep $serviceName"
          services=$watch_result
  fi

  is_services_defined

   while read -r service
   do
     service=$(echo $service | awk '{print $1;}')
     laggerCommand="lagger"

      #Defult lines
      if [ -z "$lines" ]; then
         lines=100
      fi

      if [ -z "$sshLogsCommand" ]; then
        kubeCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace logs -f --tail=$lines $* $service"
      else
        kubeCommand=`printf "$sshLogsCommand" "$lines" "$service"`
      fi

      if [ ! -z "$consolidateOutput" ]; then
           laggerCommand="$laggerCommand -t=${service}"
      fi

      if [ ! -z "$performanceMsGapThreshold" ]; then
          laggerCommand="$laggerCommand --performance-threshold=$performanceMsGapThreshold"
      fi

      kubeCommand="$kubeCommand | $laggerCommand | grep --color=never -E '$filter$PerformanceFilter'"
      echo "kubeCommand = $kubeCommand"
      if [ -z "$consolidateOutput" ]; then
        executeInNewTab $kubeCommand
      else
        # trap ctrl-c and call ctrl_c()
        trap ctrl_c INT
        eval $kubeCommand &
        PID_ARRAY+=("$!")
      fi
   done <<< "$services"
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
     echo "excluding from docker: $2"
     if [ -z "$1" ]; then
         execCommandArg="sh"
     elif [ "$1" == "logs" ]; then
         execCommandArg="-- bash -c '$pollContainersFunctionString && pollContainers $2'"
     else
       execCommandArg=$1
     fi

     initGetPodsCommand
     services=$(eval $getPodsCommand | grep $serviceName)
	   is_services_defined
	   while read -r service
	   do
	      service=$(echo $service | awk '{print $1;}')
	      kubeCommand="kubectl --kubeconfig=$kubeconfig --namespace=$namespace exec -it $service $execCommandArg"
	      executeInNewTab $kubeCommand
	      break;
	   done <<< "$services"
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
