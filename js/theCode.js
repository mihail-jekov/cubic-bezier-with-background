var radius = 5;
var bezierPoints = [];
var image, canvas, selectedPoint = null, selectPointIndex = 0, imagePoint = {x: 0, y: 0}, imageOffsetPoint = null;

$(function()
{
	var dropZone = document.getElementById('canvas');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	canvas = document.getElementById('canvas').getContext('2d');

	$("#canvas").mousedown(function (event)
	{
		mouse = mouseXYtoCanvas(event);
		
		$.each(bezierPoints, function(index, value)
		{
			if (((value.x - mouse.x) * (value.x - mouse.x) + (value.y - mouse.y) * (value.y - mouse.y)) < radius * radius)
			{
				if(event.which == 3)
				{
					removePoint(index);
				}
				else
				{
					selectedPoint = bezierPoints[index];
					selectPointIndex = index;
				}
				return false;
			}
		});
		
		if (selectedPoint == null && image != null && event.which == 1)
		{
			if (imagePoint.x < mouse.x && imagePoint.x + image.width > mouse.x && imagePoint.y < mouse.y && imagePoint.y + image.height > mouse.y)
			{
				imageOffsetPoint = {x: 0, y: 0};
				imageOffsetPoint.x = mouse.x - imagePoint.x;
				imageOffsetPoint.y = mouse.y - imagePoint.y;
			}
		}
		
		if (selectedPoint == null && $('#clickAddPoint').is(':checked') && event.which == 1)
		{
			addNewKeyPoint(mouse);
		}
	});
	
	$("#canvas").mouseup(function ()
	{
		selectedPoint = null;
		imageOffsetPoint = null;
	})
	
	$("#canvas").mousemove(function (event)
	{
		mouse = mouseXYtoCanvas(event);
		
		$('#canvas').css('cursor', 'default');
		$.each(bezierPoints, function(index, value)
		{
			if(((value.x - mouse.x) * (value.x - mouse.x) + (value.y - mouse.y) * (value.y - mouse.y)) < radius * radius)
			{
				$('#canvas').css('cursor', 'pointer');
				return false;
			}
		});
		
		if (selectedPoint != null)
		{
			var vectorPrev = null, vectorNext = null;
			if(selectedPoint.key && $('#lockAdjent').is(':checked'))
			{
				if (selectPointIndex != 0) vectorPrev = {x: bezierPoints[selectPointIndex - 1].x - selectedPoint.x, y: bezierPoints[selectPointIndex - 1].y - selectedPoint.y};
				if (selectPointIndex < bezierPoints.length - 1) vectorNext = {x: bezierPoints[selectPointIndex + 1].x - selectedPoint.x, y: bezierPoints[selectPointIndex + 1].y - selectedPoint.y};
			}
			selectedPoint.x = mouse.x;
			selectedPoint.y = mouse.y;
			if (vectorPrev != null)
			{
				bezierPoints[selectPointIndex - 1].x = mouse.x + vectorPrev.x;
				bezierPoints[selectPointIndex - 1].y = mouse.y + vectorPrev.y;
			}
			if (vectorNext != null)
			{
				bezierPoints[selectPointIndex + 1].x = mouse.x + vectorNext.x;
				bezierPoints[selectPointIndex + 1].y = mouse.y + vectorNext.y;
			}
			drawCanvas();
		}
		if (imageOffsetPoint != null)
		{
			imagePoint.x = mouse.x - imageOffsetPoint.x;
			imagePoint.y = mouse.y - imageOffsetPoint.y;
			drawCanvas();
		}
	});

	$("#clearPoints").click(function()
	{
		bezierPoints = [];
		drawCanvas();
	});
	
	$("#clearImage").click(function()
	{
		image = null;
		drawCanvas();
	});
	
	$("#removeLastPoint").click(function()
	{
		removePoint(bezierPoints.length - 1);
	});
	
	$("input[name=relativeTo]").attr('disabled', 'disabled');
	
	drawCanvas();
});

function addNewKeyPoint(mouse)
{
	if (bezierPoints.length == 0) bezierPoints[0] = {x: mouse.x, y: mouse.y, key: true};
	else
	{
		index = bezierPoints.length - 1;
		bezierPoints[index + 3] = {x: mouse.x, y: mouse.y, key: true};
		generateAdjentBetweenPoints(index);
	}
	drawCanvas();
}

function removePoint(index)
{
	if(index % 3 == 0)
	{
		if (index == 0) bezierPoints = bezierPoints.slice(3, bezierPoints.length);
		else if (index == bezierPoints.length - 1) bezierPoints = bezierPoints.slice(0, bezierPoints.length - 3);
		else
		{
			bezierPoints[index] = bezierPoints[index + 3];
			generateAdjentBetweenPoints(index - 3);
			bezierPoints = bezierPoints.slice(0, index + 1).concat(bezierPoints.slice(index + 4, bezierPoints.length));
		}
		drawCanvas();
	}
}

function generateAdjentBetweenPoints(index)
{
	first = bezierPoints[index];
	second = bezierPoints[index + 3];
	vector = {x: first.x - second.x, y: first.y - second.y};
	var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
	vector.x /= length;
	vector.y /= length;
	bezierPoints[index + 1] = {x: first.x + vector.x * 30, y: first.y + vector.y * 30, key: false};
	bezierPoints[index + 2] = {x: second.x - vector.x * 30, y: second.y - vector.y * 30, key: false};
}
	
function updatePoints()
{
	var result = "Point's coordinates: \n";
	$.each(bezierPoints, function(index, value)
	{
		result += "(" + value.x.toFixed(2) + ", " + value.y.toFixed(2) + ")";
		if (index != bezierPoints.length - 1) result += ", ";
	});
	$("#pointsField").text(result);
}

function mouseXYtoCanvas(mousePoint)
{
	return {x: mousePoint.pageX - $("#canvas").offset().left, y: mousePoint.pageY - $("#canvas").offset().top};
}

function handleFileSelect(evt)
{
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files;
	for (var i = 0, f; f = files[i]; i++)
	{
		image = new Image;
		image.src = URL.createObjectURL(files[0]);
		image.onload = function()
		{
			drawCanvas();
		}
	}
}

function handleDragOver(evt)
{
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}
			
function drawCanvas()
{
	canvas.clearRect(0, 0, 1500, 1000);
	updatePoints();
	
	if (image != null) canvas.drawImage(image, imagePoint.x, imagePoint.y);
	
	$.each(bezierPoints, function(index, value)
	{
		canvas.beginPath();
		canvas.arc(value.x, value.y, radius, 0, Math.PI * 2, false);
		if (index % 3 == 0) canvas.fillStyle = '#000000';
		else
		{
			canvas.fillStyle = '#999999';
			canvas.strokeStyle = '#999999';
			canvas.moveTo(value.x, value.y);
			if (index % 3 == 1) canvas.lineTo(bezierPoints[index - 1].x, bezierPoints[index - 1].y);
			else canvas.lineTo(bezierPoints[index + 1].x, bezierPoints[index + 1].y);
			canvas.stroke();
		}
		canvas.fill();
	});
	
	canvas.beginPath();
	canvas.moveTo(bezierPoints[0].x, bezierPoints[0].y);
	canvas.strokeStyle = '#000000';
	for(var i = 1; i < bezierPoints.length; i += 3)
	{
		canvas.bezierCurveTo(bezierPoints[i].x, bezierPoints[i].y, bezierPoints[i + 1].x, bezierPoints[i + 1].y, bezierPoints[i + 2].x, bezierPoints[i + 2].y);
		canvas.stroke();
	}
}