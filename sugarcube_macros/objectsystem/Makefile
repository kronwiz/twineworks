dummy: compile

compile:
	rm -f demo.html
	tweego -o demo.html .

watch:
	# must build the demo outside of this folder otherwise tweego
	# tries to import the demo itself in a subsequent run and complains
	tweego -w -o ../demo.html .

