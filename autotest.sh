
while [ 1 ]
do
	if [ 0 -lt `find . -cnewer lasttest -ls | wc -l` ]
	then
		clear
		touch lasttest
		node_modules/.bin/jasmine-node spec
		echo '<done>'
	fi
	sleep 1
done

