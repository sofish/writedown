$(function(){

  var $range = $('input[type=range]');

  // set default value
  $preview.on('change', 'input[type=range]', function() {
    var val, that;

    that = $(this);
    val = that.val();

    that.parent().find('span').html(val);
    localStorage.setItem('wd' + that.attr('id'), val);
  });

  // default value
  ~function() {

    $range.each(function() {
      var item = $(this)
        , history = localStorage.getItem('wd' + item.attr('id'));

      if(history) item.val(history);
      item.parent().find('span').html(item.val());
    })

  }();


  // reset to default
  $('#reset').on('click', function() {
    $range.each(function() {
      var item = $(this);
      localStorage.removeItem('wd' + item.attr('id'));
      item.val(item.data('default'));
      item.trigger('change');
    })
  })

})