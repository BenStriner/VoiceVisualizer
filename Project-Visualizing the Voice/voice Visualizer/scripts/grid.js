  //scripts for grid 

    var songlisturl = new Array;
    var songlistname = new Array;
    var refurl, refname, usrsongname, usrurl;


    function requiredFieldValidator(value) {
      if (value == null || value == undefined || !value.length) {
        return {valid: false, msg: "This is a required field"};
      } else {
        return {valid: true, msg: null};
      }
    }

    var grid;
    var data = [];
    var columns = [];

    columns = [

        {id: "Graph", name: "Graph", field: "Graph", width: 100, cssClass: "cell-effort-driven", field: "Graph", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox},
        {id: "Recording List", name: "Recording List", field: "Recording List", width: 200, editor: Slick.Editors.Text, validator: requiredFieldValidator},
        {id: "URL", name: "URL", field: "URL", width: 200, editor: Slick.Editors.Text},
        {id: "Created Time", name: "Created Time", field: "Created Time", width: 100, editor: Slick.Editors.Date},
        {id: "Set Reference", name: "Set Reference", width: 200, minWidth: 100, maxWidth: 200, cssClass: "cell-effort-driven", field: "effortDriven", formatter: Slick.Formatters.Checkmark, editor: Slick.Editors.Checkbox}
    ];


    var options = {
      editable: true,
      enableAddRow: true,
      enableCellNavigation: true,
      asyncEditorLoading: false,
      autoEdit: false
    };


  function openDetails() {
    if (grid.getEditorLock().isActive() && !grid.getEditorLock().commitCurrentEdit()) {
      return;
    }

    var $modal = $("<div class='item-details-form'></div>");

    $modal = $("#itemDetailsTemplate")
        .tmpl({
          context: grid.getDataItem(grid.getActiveCell().row),
          columns: columns
        })
        .appendTo("body");

    $modal.keydown(function (e) {
      if (e.which == $.ui.keyCode.ENTER) {
        grid.getEditController().commitCurrentEdit();
        e.stopPropagation();
        e.preventDefault();
      } else if (e.which == $.ui.keyCode.ESCAPE) {
        grid.getEditController().cancelCurrentEdit();
        e.stopPropagation();
        e.preventDefault();
      }
    });

    $modal.find("[data-action=save]").click(function () {
      grid.getEditController().commitCurrentEdit();
    });

    $modal.find("[data-action=cancel]").click(function () {
      grid.getEditController().cancelCurrentEdit();
    });


    var containers = $.map(columns, function (c) {
      return $modal.find("[data-editorid=" + c.id + "]");
    });

    var compositeEditor = new Slick.CompositeEditor(
        columns,
        containers,
        {
          destroy: function () {
            $modal.remove();
          }
        }
    );

    grid.editActiveCell(compositeEditor);
  }

  $(function () {
    for (var i = 0; i <3; i++) {
      var d = (data[i] = {});
if(i == 0)
{
      d["Graph"] = (i== 0);
      d["Recording List"] = "Recording_Teacher";
      d["URL"] = "CallasLakmeIntro.mp3";
      d["Created Time"] = "01/" + (10-i) +"/2013";
      d["effortDriven"] = (i  == 0);
}
if(i ==1)
{
      d["Graph"] = (i ==1);
      d["Recording List"] = "Recording_me1";
      d["URL"] = "badLakmeIntro.mp3";
      d["Created Time"] = "01/" + (10-i) +"/2013";
      //d["effortDriven"] = (i  == 0);
}
if(i ==2)
{
      //d["Graph"] = (i==0 || i ==1);
      d["Recording List"] = "Recording_me2";
      d["URL"] = "me2.mp3";
      d["Created Time"] = "01/" + (10-i) +"/2013";
      //d["effortDriven"] = (i  == 0);

}
      
    }

    grid = new Slick.Grid("#myGrid", data, columns, options);

    grid.onAddNewRow.subscribe(function (e, args) {
      var item = args.item;
      var column = args.column;
      grid.invalidateRow(data.length);
      data.push(item);
      grid.updateRowCount();
      grid.render();
    });


    grid.onValidationError.subscribe(function (e, args) {
      // handle validation errors originating from the CompositeEditor
      if (args.editor && (args.editor instanceof Slick.CompositeEditor)) {
        var err;
        var idx = args.validationResults.errors.length;
        while (idx--) {
          err = args.validationResults.errors[idx];
          $(err.container).stop(true, true).effect("highlight", {color: "red"});
        }
      }
    });

    grid.setActiveCell(0, 0);
  });

  function DetectSelection(){
    //alert("start detection");
    var num = 0;
    var k = 0;
     var graphlist = document.getElementsByClassName("slick-cell l0 r0 cell-effort-driven");

     for(var i = 0; i <graphlist.length; i++)
     {
      //alert("i:"+i);
      //if(checklist[i].hasChildNodes)
      if(graphlist[i].hasChildNodes())
      {
        //alert("selected song:"+graphlist[i].nextSibling.nextSibling.innerHTML);
        songlisturl[k] = graphlist[i].nextSibling.nextSibling.innerHTML;
        songlistname[k] = graphlist[i].nextSibling.innerHTML;

        if(graphlist[i].nextSibling.nextSibling.nextSibling.nextSibling.hasChildNodes())
        {
          //alert("this is set ref!");
          refurl = graphlist[i].nextSibling.nextSibling.innerHTML;
          refname = graphlist[i].nextSibling.innerHTML;
        }
      }
      k++;
     } 

     for (var j = 0; j<songlistname.length; j++)
     {
      if (songlistname[j] == refname) {}
        else
        {
          usrsongname = songlistname[j];
          usrurl = songlisturl[j];
        }
    
     }
    };

    function startloadref()
    {
      loadSound(refurl);
    };

    function startloadusr()
    {
      loadSound_usr(usrurl);
    };

