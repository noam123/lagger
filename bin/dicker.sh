
#echo $@
rest_of_args=${@: 3}
echo $2 $rest_of_args

function pause(){
   read -p "$*"
}

case "$1" in
        start)
            docker start $(docker ps -a | grep $2 | awk '{print $1;}' | xargs )
            ;;
         
        stop)
             docker stop $(docker ps | grep $2 | awk '{print $1;}' | xargs )
            ;;
         
        logs)
            docker logs -f $(docker ps | grep $2 | awk '{print $1;}' | xargs ) $rest_of_args
            ;;
        
		rm)
            docker rm -f $(docker ps | grep $2 | awk '{print $1;}' | xargs )
            ;; 
        restart)
            docker restart $(docker ps | grep $2 | awk '{print $1;}' | xargs )
            ;; 
        exec)
            docker exec -it $(docker ps | grep $2 | awk '{print $1;}' | xargs ) $3
            ;;
        inspect)
            docker inspect $(docker ps | grep $2 | awk '{print $1;}' | xargs )
            ;;                         			
        *)
            echo $"Usage: $0 {start|stop|logs|rm}"
            exit 1
 
esac




